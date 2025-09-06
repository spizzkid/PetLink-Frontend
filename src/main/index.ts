import { app, shell, BrowserWindow, ipcMain, netLog, session } from 'electron'
import { exec } from 'child_process'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { BackupService } from './backup'
import databaseService from './database'
import axios, { type AxiosRequestConfig } from 'axios'
import https from 'https'
import http from 'http'
import dns from 'dns'
import fs from 'fs'

// 绕过系统/Clash 等代理，强制直连（诊断代理导致的 TLS/握手问题）。
// 必须在 app ready 之前设置。
app.commandLine.appendSwitch('no-proxy-server')
app.commandLine.appendSwitch('proxy-server', 'direct://')
app.commandLine.appendSwitch('proxy-bypass-list', '*')
// 添加更多网络相关的开关
app.commandLine.appendSwitch('disable-http2')
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('ignore-ssl-errors')
app.commandLine.appendSwitch('ignore-certificate-errors-spki-list')
app.commandLine.appendSwitch('disable-web-security')

// 单实例锁，避免多个实例同时占用缓存目录（Windows 上常见 0x5 拒绝访问）
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', () => {
    // 可选：聚焦已打开窗口
    const wins = BrowserWindow.getAllWindows()
    if (wins.length) {
      const w = wins[0]
      if (w.isMinimized()) w.restore()
      w.focus()
    }
  })
}

// 将磁盘缓存指向系统可写临时目录，避免被权限/占用阻塞
try {
  const cacheDir = join(app.getPath('temp'), 'petlink-cache')
  fs.mkdirSync(cacheDir, { recursive: true })
  app.commandLine.appendSwitch('disk-cache-dir', cacheDir)
  // 降低 GPU 着色器磁盘缓存对磁盘的依赖（可选）
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
  app.commandLine.appendSwitch('gpu-program-cache-size-kb', '0')
} catch (e) {
  console.warn('setup disk cache dir failed:', e)
}

// 可选：通过环境变量禁用硬件加速，绕开 GPU 缓存路径问题（仅在必要时开启）
if (process.env.PETLINK_DISABLE_HW_ACCEL === '1') {
  app.disableHardwareAcceleration()
}

// 云端版本 - 主进程只处理窗口管理和基本 IPC

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // 启动时清理缓存，释放可能被占用的磁盘缓存/着色器缓存
  try {
    await session.defaultSession.clearCache()
    await session.defaultSession.clearStorageData({
      storages: ['shadercache', 'cachestorage', 'serviceworkers']
    })
  } catch (e) {
    console.warn('clear cache/storage failed:', e)
  }
  // 开始抓网络日志（调试用）
  try {
    await netLog.startLogging('netlog.json', { captureMode: 'everything' })
  } catch (err) {
    console.warn('netLog.startLogging failed:', err)
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // SQLite 数据库 IPC 处理器
  // 客户相关
  ipcMain.handle('db:getClients', () => {
    try {
      const clients = databaseService.getClients()
      return { success: true, data: clients }
    } catch (error) {
      console.error('获取客户列表失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:getClientById', (_, id: string) => {
    try {
      const client = databaseService.getClientById(id)
      return { success: true, data: client }
    } catch (error) {
      console.error('获取客户详情失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:createClient', (_, data: any) => {
    try {
      const client = databaseService.createClient(data)
      return { success: true, data: client }
    } catch (error) {
      console.error('创建客户失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:updateClient', (_, id: string, data: any) => {
    try {
      const client = databaseService.updateClient(id, data)
      return { success: true, data: client }
    } catch (error) {
      console.error('更新客户失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:deleteClient', (_, id: string) => {
    try {
      const result = databaseService.deleteClient(id)
      return { success: true, data: result }
    } catch (error) {
      console.error('删除客户失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:searchClients', (_, query: string) => {
    try {
      const clients = databaseService.searchClients(query)
      return { success: true, data: clients }
    } catch (error) {
      console.error('搜索客户失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 宠物相关
  ipcMain.handle('db:getPets', () => {
    try {
      const pets = databaseService.getPets()
      return { success: true, data: pets }
    } catch (error) {
      console.error('获取宠物列表失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:getPetById', (_, id: string) => {
    try {
      const pet = databaseService.getPetById(id)
      return { success: true, data: pet }
    } catch (error) {
      console.error('获取宠物详情失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:getPetsByOwner', (_, ownerId: string) => {
    try {
      const pets = databaseService.getPetsByOwner(ownerId)
      return { success: true, data: pets }
    } catch (error) {
      console.error('获取主人宠物列表失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:createPet', (_, data: any) => {
    try {
      const pet = databaseService.createPet(data)
      return { success: true, data: pet }
    } catch (error) {
      console.error('创建宠物失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:updatePet', (_, id: string, data: any) => {
    try {
      const pet = databaseService.updatePet(id, data)
      return { success: true, data: pet }
    } catch (error) {
      console.error('更新宠物失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:deletePet', (_, id: string) => {
    try {
      const result = databaseService.deletePet(id)
      return { success: true, data: result }
    } catch (error) {
      console.error('删除宠物失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:searchPets', (_, query: string) => {
    try {
      const pets = databaseService.searchPets(query)
      return { success: true, data: pets }
    } catch (error) {
      console.error('搜索宠物失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 健康检查相关
  ipcMain.handle('db:getHealthChecks', () => {
    try {
      const healthChecks = databaseService.getHealthChecks()
      return { success: true, data: healthChecks }
    } catch (error) {
      console.error('获取健康检查列表失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:getHealthCheckById', (_, id: string) => {
    try {
      const healthCheck = databaseService.getHealthCheckById(id)
      return { success: true, data: healthCheck }
    } catch (error) {
      console.error('获取健康检查详情失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:getHealthChecksByPet', (_, petId: string) => {
    try {
      const healthChecks = databaseService.getHealthChecksByPet(petId)
      return { success: true, data: healthChecks }
    } catch (error) {
      console.error('获取宠物健康检查列表失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:createHealthCheck', (_, data: any) => {
    try {
      const healthCheck = databaseService.createHealthCheck(data)
      return { success: true, data: healthCheck }
    } catch (error) {
      console.error('创建健康检查失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:updateHealthCheck', (_, id: string, data: any) => {
    try {
      const healthCheck = databaseService.updateHealthCheck(id, data)
      return { success: true, data: healthCheck }
    } catch (error) {
      console.error('更新健康检查失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('db:deleteHealthCheck', (_, id: string) => {
    try {
      const result = databaseService.deleteHealthCheck(id)
      return { success: true, data: result }
    } catch (error) {
      console.error('删除健康检查失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 统计信息
  ipcMain.handle('db:getStats', () => {
    try {
      const stats = databaseService.getStats()
      return { success: true, data: stats }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  // 运行时也强制直连（双保险）
  try {
    await session.defaultSession.setProxy({ mode: 'direct' })
  } catch (e) {
    console.warn('setProxy(direct) failed:', e)
  }

  // HTTP/HTTPS Agents
  const httpAgent = new http.Agent({ keepAlive: true })
  // 默认 HTTPS Agent（系统策略，TLS1.3 可用时会用）
  const httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: true
  })
  // 回退 Agent：强制 IPv4 与 TLS1.2，规避部分网络/中间盒导致的连接复位
  const httpsAgentFallback = new https.Agent({
    keepAlive: false, // 部分设备对 keep-alive 处理不佳
    rejectUnauthorized: true,
    // 强制使用 IPv4 解析，避免 AAAA/IPv6 路径被复位
    lookup: (hostname, options, callback) => {
      // 确保参数类型正确
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      const opts = { family: 4, ...(options || {}) }
      console.log(`DNS lookup for ${hostname} with IPv4`)
      dns.lookup(hostname, opts, (err, address, family) => {
        if (err) {
          console.error(`DNS lookup failed for ${hostname}:`, err)
          callback(err, address, family)
        } else {
          console.log(`DNS resolved ${hostname} -> ${address} (IPv${family})`)
          callback(null, address, family)
        }
      })
    },
    // 限制到 TLS1.2，提高兼容性（老式网关/代理）
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.2'
  })

  // 统一的请求发送器（带 ECONNRESET/EPROTO 回退重试）
  async function sendRequestWithFallback<T = unknown>(cfg: {
    url: string
    method: string
    headers?: Record<string, string>
    data?: unknown
    timeout?: number
    responseType?: 'json' | 'text' | 'arraybuffer'
  }): Promise<{
    ok: boolean
    status?: number
    data?: T
    headers?: Record<string, string>
    error?: string
  }> {
    const isHttps = cfg.url.startsWith('https:')
    const defaultHeaders: Record<string, string> = {
      'User-Agent': 'petlink-electron/1.0',
      Accept: 'application/json, text/plain, */*'
    }
    const base: AxiosRequestConfig = {
      url: cfg.url,
      method: cfg.method as AxiosRequestConfig['method'],
      headers: { ...defaultHeaders, ...(cfg.headers || {}) },
      data: cfg.data,
      timeout: cfg.timeout ?? 20000,
      proxy: false,
      validateStatus: () => true,
      responseType: (cfg.responseType ?? 'json') as AxiosRequestConfig['responseType'],
      httpAgent,
      httpsAgent: isHttps ? httpsAgent : undefined,
      transitional: { clarifyTimeoutError: true }
    }

    try {
      const res = await axios.request(base)
      return {
        ok: res.status >= 200 && res.status < 400,
        status: res.status,
        data: res.data,
        headers: Object.fromEntries(
          Object.entries(res.headers as Record<string, unknown>).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.join(', ') : String(v)
          ])
        )
      }
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException
      const code = e?.code as string | undefined
      const shouldRetry = code === 'ECONNRESET' || code === 'EPROTO' || code === 'ECONNABORTED'
      // 详细日志，便于定位（仅开发时可见）
      {
        type ErrShape = NodeJS.ErrnoException & {
          syscall?: string
          address?: string
          port?: number
        }
        const ee = e as ErrShape
        console.error('axios primary request failed:', {
          message: ee?.message,
          code: ee?.code,
          syscall: ee?.syscall,
          address: ee?.address,
          port: ee?.port,
          url: cfg.url
        })
      }

      if (!isHttps || !shouldRetry) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) }
      }

      // 回退：IPv4 + TLS1.2 + 关闭 keep-alive
      try {
        const res = await axios.request({
          ...base,
          httpsAgent: httpsAgentFallback,
          // 某些网络栈对压缩或连接头处理有问题，显式声明
          headers: {
            'Accept-Encoding': 'gzip, deflate',
            Connection: 'close',
            ...defaultHeaders,
            ...(cfg.headers || {})
          }
        })
        return {
          ok: res.status >= 200 && res.status < 400,
          status: res.status,
          data: res.data,
          headers: Object.fromEntries(
            Object.entries(res.headers as Record<string, unknown>).map(([k, v]) => [
              k,
              Array.isArray(v) ? v.join(', ') : String(v)
            ])
          )
        }
      } catch (err2: unknown) {
        type ErrShape2 = NodeJS.ErrnoException & {
          syscall?: string
          address?: string
          port?: number
        }
        const e2 = err2 as ErrShape2
        console.error('axios fallback request failed:', {
          message: e2?.message,
          code: e2?.code,
          syscall: e2?.syscall,
          address: e2?.address,
          port: e2?.port,
          url: cfg.url
        })
        return { ok: false, error: e2 instanceof Error ? e2.message : String(e2) }
      }
    }
  }

  // 通用 API 请求代理：渲染进程通过 IPC 调用，Node/axios 发送
  ipcMain.handle(
    'api:request',
    async (
      _,
      req: {
        url: string
        method?: string
        headers?: Record<string, string>
        body?: unknown
        responseType?: 'json' | 'text' | 'arraybuffer'
        timeoutMs?: number
      }
    ) => {
      console.log(`API Request: ${req.method || 'GET'} ${req.url}`)
      console.log('Request Headers:', JSON.stringify(req.headers, null, 2))
      try {
        // 使用已有的回退机制，提高网络兼容性
        const res = await sendRequestWithFallback({
          url: req.url,
          method: req.method ?? 'GET',
          headers: req.headers,
          data: req.body,
          timeout: req.timeoutMs ?? 15000,
          responseType: req.responseType ?? 'json'
        })

        console.log(`API Response: ${res.status || 'N/A'} for ${req.url}`)
        return {
          ok: res.ok,
          status: res.status,
          data: res.data,
          headers: res.headers
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`API Error for ${req.url}:`, msg)
        return { ok: false, error: msg }
      }
    }
  )

  // AI 上传专用（支持 fileBuffer 或 filePath -> multipart）
  ipcMain.handle(
    'ai:upload',
    async (
      _,
      payload: {
        url: string
        filePath?: string
        fileBuffer?: ArrayBuffer | Uint8Array
        fileName?: string
        mode?: string
        headers?: Record<string, string>
      }
    ) => {
      try {
        const formBoundary = '----PetlinkBoundary' + Math.random().toString(16).slice(2)
        const parts: Buffer[] = []
        const crlf = '\r\n'
        const pushText = (s: string): number => parts.push(Buffer.from(s, 'utf8'))

        // mode 字段
        if (payload.mode) {
          pushText(`--${formBoundary}${crlf}`)
          pushText(`Content-Disposition: form-data; name="mode"${crlf}${crlf}`)
          pushText(`${payload.mode}${crlf}`)
        }

        // file 字段 头
        const filename =
          payload.fileName ||
          (payload.filePath ? payload.filePath.split(/\\|\//).pop() : undefined) ||
          'file.docx'
        pushText(`--${formBoundary}${crlf}`)
        pushText(`Content-Disposition: form-data; name="file"; filename="${filename}"${crlf}`)
        // 泛型 Word 类型；实际后端不敏感
        pushText(
          `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document${crlf}${crlf}`
        )
        // 文件内容
        if (payload.fileBuffer) {
          const buf = Buffer.isBuffer(payload.fileBuffer)
            ? (payload.fileBuffer as Buffer)
            : Buffer.from(payload.fileBuffer as ArrayBuffer)
          parts.push(buf)
        } else if (payload.filePath) {
          const fileBuf = fs.readFileSync(payload.filePath)
          parts.push(fileBuf)
        } else {
          return { ok: false, error: 'fileBuffer or filePath is required' }
        }
        pushText(crlf)

        // 结束边界
        pushText(`--${formBoundary}--${crlf}`)
        const body = Buffer.concat(parts)

        const res = await axios
          .post(payload.url, body, {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
              'Content-Length': String(body.length),
              ...(payload.headers || {})
            },
            httpsAgent,
            httpAgent,
            proxy: false,
            timeout: 30000,
            validateStatus: () => true,
            transitional: { clarifyTimeoutError: true }
          })
          .catch(async (err: unknown) => {
            // 回退上传
            const e = err as NodeJS.ErrnoException
            const code = e?.code as string | undefined
            if (code === 'ECONNRESET' || code === 'EPROTO' || code === 'ECONNABORTED') {
              console.error('ai:upload primary failed, retrying with fallback agent:', {
                message: e?.message,
                code: e?.code,
                url: payload.url
              })
              return axios.post(payload.url, body, {
                headers: {
                  'Content-Type': `multipart/form-data; boundary=${formBoundary}`,
                  'Content-Length': String(body.length),
                  Connection: 'close',
                  'Accept-Encoding': 'gzip, deflate',
                  ...(payload.headers || {})
                },
                httpsAgent: httpsAgentFallback,
                httpAgent,
                proxy: false,
                timeout: 30000,
                validateStatus: () => true,
                transitional: { clarifyTimeoutError: true }
              })
            }
            throw err
          })

        return {
          ok: res.status >= 200 && res.status < 400,
          status: res.status,
          data: res.data,
          headers: res.headers
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { ok: false, error: msg }
      }
    }
  )

  // AI 下载（保存到本地路径；savePath 可选，默认下载目录）
  ipcMain.handle(
    'ai:download',
    async (_, payload: { url: string; savePath?: string; headers?: Record<string, string> }) => {
      try {
        const res = await axios
          .get(payload.url, {
            responseType: 'arraybuffer',
            httpsAgent,
            httpAgent,
            proxy: false,
            timeout: 30000,
            headers: payload.headers,
            validateStatus: () => true,
            transitional: { clarifyTimeoutError: true }
          })
          .catch(async (err: unknown) => {
            const e = err as NodeJS.ErrnoException
            const code = e?.code as string | undefined
            if (code === 'ECONNRESET' || code === 'EPROTO' || code === 'ECONNABORTED') {
              console.error('ai:download primary failed, retrying with fallback agent:', {
                message: e?.message,
                code: e?.code,
                url: payload.url
              })
              return axios.get(payload.url, {
                responseType: 'arraybuffer',
                httpsAgent: httpsAgentFallback,
                httpAgent,
                proxy: false,
                timeout: 30000,
                headers: {
                  'Accept-Encoding': 'gzip, deflate',
                  Connection: 'close',
                  ...(payload.headers || {})
                },
                validateStatus: () => true,
                transitional: { clarifyTimeoutError: true }
              })
            }
            throw err
          })
        if (res.status >= 200 && res.status < 400) {
          const targetPath =
            payload.savePath ||
            (() => {
              const downloads = app.getPath('downloads')
              const name = `petlink-report-${Date.now()}.pdf`
              return join(downloads, name)
            })()
          fs.writeFileSync(targetPath, Buffer.from(res.data))
          return { ok: true, status: res.status, path: targetPath }
        }
        return { ok: false, status: res.status }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return { ok: false, error: msg }
      }
    }
  )

  // 云端备份相关 IPC 处理器
  ipcMain.handle('create-backup', async () => {
    try {
      const backupPath = await BackupService.createCloudBackup()
      return { success: true, data: backupPath }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('restore-backup', async (_, backupPath: string) => {
    try {
      await BackupService.restoreCloudBackup(backupPath)
      return { success: true, data: '云端备份恢复成功' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('export-data', async () => {
    try {
      const exportPath = await BackupService.exportCloudData()
      return { success: true, data: exportPath }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('import-data', async (_, importPath: string) => {
    try {
      await BackupService.importCloudData(importPath)
      return { success: true, data: '云端数据导入成功' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('get-backup-list', async () => {
    try {
      const backups = await BackupService.getCloudBackupList()
      return { success: true, data: backups }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('delete-backup', async (_, backupPath: string) => {
    try {
      await BackupService.deleteBackup(backupPath)
      return { success: true, data: '备份删除成功' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('cleanup-old-backups', async (_, keepCount?: number) => {
    try {
      await BackupService.cleanupOldBackups(keepCount)
      return { success: true, data: '旧备份清理成功' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('get-storage-info', async () => {
    try {
      const storageInfo = await BackupService.getStorageInfo()
      return { success: true, data: storageInfo }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('check-cloud-connection', async () => {
    try {
      const connection = await BackupService.checkCloudConnection()
      return { success: true, data: connection }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // 打开路径相关 IPC 处理器
  ipcMain.handle('open-path', async (_, path: string) => {
    try {
      const { platform } = process
      let command: string

      if (platform === 'win32') {
        command = `explorer "${path}"`
      } else if (platform === 'darwin') {
        command = `open "${path}"`
      } else {
        command = `xdg-open "${path}"`
      }

      exec(command, (error) => {
        if (error) {
          console.error('Failed to open path:', error)
        }
      })
    } catch (error) {
      console.error('Error opening path:', error)
    }
  })

  app.on('before-quit', async () => {
    try {
      await netLog.stopLogging()
    } catch (err) {
      console.warn('netLog.stopLogging failed:', err)
    }
  })

  createWindow()

  // 添加网络诊断IPC处理器
  ipcMain.handle('network:test-dns', async (_, hostname: string) => {
    return new Promise((resolve) => {
      console.log(`Testing DNS resolution for ${hostname}`)
      dns.lookup(hostname, { family: 4 }, (err, address, family) => {
        if (err) {
          console.error(`DNS lookup failed for ${hostname}:`, err)
          resolve({ success: false, error: err.message })
        } else {
          console.log(`DNS resolved ${hostname} -> ${address} (IPv${family})`)
          resolve({ success: true, address, family })
        }
      })
    })
  })

  ipcMain.handle('network:test-connection', async (_, url: string) => {
    try {
      console.log(`Testing connection to ${url}`)

      // 尝试多种不同的配置
      const configs: Array<{
        name: string
        config: AxiosRequestConfig
      }> = [
        {
          name: 'default',
          config: {
            timeout: 10000,
            httpsAgent,
            proxy: false,
            validateStatus: () => true
          }
        },
        {
          name: 'ipv4-only',
          config: {
            timeout: 10000,
            httpsAgent: httpsAgentFallback,
            proxy: false,
            validateStatus: () => true
          }
        },
        {
          name: 'simple',
          config: {
            timeout: 10000,
            proxy: false,
            validateStatus: () => true,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false // 临时忽略证书验证
            })
          }
        }
      ]

      for (const { name, config } of configs) {
        try {
          console.log(`Trying ${name} config for ${url}`)
          const res = await axios.get(url, config)
          console.log(`Success with ${name}: ${res.status} ${res.statusText}`)
          return { success: true, status: res.status, statusText: res.statusText, method: name }
        } catch (err) {
          const e = err as NodeJS.ErrnoException
          console.log(`Failed with ${name}:`, e.code, e.message)
          if (name === 'simple') {
            // 如果所有配置都失败了，返回最后的错误
            return { success: false, error: e.message, code: e.code }
          }
        }
      }

      return { success: false, error: 'All connection attempts failed' }
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      console.error(`Connection test failed for ${url}:`, e.message)
      return { success: false, error: e.message, code: e.code }
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
