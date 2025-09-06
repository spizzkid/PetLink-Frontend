# PetLink 前端开发文档

## 概述

PetLink 是一个基于AI的宠物健康报告分析系统，支持 Electron 桌面应用通过 RESTful API 与后端服务交互，实现宠物健康报告的智能分析功能。

## Electron 应用特殊说明

### 开发环境配置

- **API Base URL**:
  - 开发环境: `https://api.chonglianlian.online`
  - 生产环境: `https://api.chonglianlian.online`
- **跨域处理**: Electron 应用无需处理 CORS 问题
- **网络请求**: 使用 Electron 的 `net` 模块或 `axios`/`fetch`

## 快速开始

### 基础信息

- **API Base URL**: `https://api.chonglianlian.online`
- **Content-Type**: `multipart/form-data` (文件上传) / `application/json` (其他请求)
- **字符编码**: `UTF-8`

### 认证方式

当前版本无需认证，后续可能添加API Key认证。

## API 接口文档

### 1. 文件上传和分析

**接口地址**: `POST /api/upload`

**功能描述**: 上传宠物健康报告Word文档，启动AI分析流程

**请求参数**:

```
- file (required): Word文档文件 (.doc, .docx)
- mode (optional): 分析模式，默认为"健康关注"
  - "健康关注": 通用健康分析
  - "疾病诊断": 专注疾病诊断分析
```

**请求示例**:

```javascript
const formData = new FormData()
formData.append('file', fileObject)
formData.append('mode', '健康关注')

const response = await fetch('https://api.chonglianlian.online/api/upload', {
  method: 'POST',
  body: formData
})
```

**成功响应**:

```json
{
  "task_id": "uuid-string",
  "message": "文件上传成功，开始分析...",
  "status": "processing"
}
```

**错误响应**:

```json
{
  "detail": "错误信息"
}
```

### 2. 查询任务状态

**接口地址**: `GET /api/status/{task_id}`

**功能描述**: 查询AI分析任务的实时状态和进度

**路径参数**:

```
- task_id (required): 任务ID，从上传接口获取
```

**请求示例**:

```javascript
const response = await fetch(`https://api.chonglianlian.online/api/status/${taskId}`)
const data = await response.json()
```

**成功响应**:

```json
{
  "task_id": "uuid-string",
  "status": "processing", // processing, completed, failed
  "progress": 45, // 0-100
  "message": "正在进行AI智能分析...",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:01:00Z"
}
```

**状态说明**:

- `processing`: 处理中
- `completed`: 完成
- `failed`: 失败

### 3. 下载PDF报告

**接口地址**: `GET /api/download/{task_id}`

**功能描述**: 下载AI分析完成后生成的PDF报告

**路径参数**:

```
- task_id (required): 任务ID
```

**请求示例**:

```javascript
// 方法1: 直接下载
window.open(`https://api.chonglianlian.online/api/download/${taskId}`)

// 方法2: 通过API下载
const response = await fetch(`https://api.chonglianlian.online/api/download/${taskId}`)
const blob = await response.blob()
const url = window.URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `petlink-report-${taskId}.pdf`
a.click()
```

**响应**: PDF文件流

### 4. 获取任务列表

**接口地址**: `GET /api/tasks`

**功能描述**: 获取所有任务的列表

**查询参数**:

```
- limit (optional): 返回记录数量，默认50
```

**请求示例**:

```javascript
const response = await fetch('https://api.chonglianlian.online/api/tasks?limit=20')
const data = await response.json()
```

**成功响应**:

```json
{
  "tasks": [
    {
      "task_id": "uuid-string",
      "status": "completed",
      "progress": 100,
      "created_at": "2024-01-01T12:00:00Z",
      "file_name": "宠物体检报告.docx"
    }
  ],
  "total": 1,
  "limit": 20
}
```

### 5. 获取任务统计

**接口地址**: `GET /api/tasks/stats`

**功能描述**: 获取任务统计信息

**请求示例**:

```javascript
const response = await fetch('https://api.chonglianlian.online/api/tasks/stats')
const data = await response.json()
```

**成功响应**:

```json
{
  "total_tasks": 100,
  "completed_tasks": 85,
  "processing_tasks": 10,
  "failed_tasks": 5,
  "success_rate": 85.0
}
```

### 6. 清理任务文件

**接口地址**: `DELETE /api/cleanup/{task_id}`

**功能描述**: 清理指定任务的相关文件

**路径参数**:

```
- task_id (required): 任务ID
```

**请求示例**:

```javascript
const response = await fetch(`https://api.chonglianlian.online/api/cleanup/${taskId}`, {
  method: 'DELETE'
})
```

**成功响应**:

```json
{
  "message": "任务文件清理成功"
}
```

### 7. 清理过期任务

**接口地址**: `DELETE /api/tasks/cleanup`

**功能描述**: 清理系统中已过期的任务及其关联文件，释放存储空间。

**请求示例**:

```javascript
const response = await fetch('https://api.chonglianlian.online/api/tasks/cleanup', {
  method: 'DELETE'
})
const data = await response.json()
```

**成功响应**:

```json
{
  "message": "过期任务清理完成"
}
```

## Electron 应用完整工作流程示例

### 1. Electron 主进程配置

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const axios = require('axios')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  mainWindow.loadFile('index.html')

  // 开发工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow)

// IPC 处理 API 请求
ipcMain.handle('upload-file', async (event, filePath, mode) => {
  try {
    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))
    formData.append('mode', mode)

    const response = await axios.post('https://api.chonglianlian.online/api/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    })

    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
})

ipcMain.handle('get-status', async (event, taskId) => {
  try {
    const response = await axios.get(`https://api.chonglianlian.online/api/status/${taskId}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
})

ipcMain.handle('download-report', async (event, taskId) => {
  try {
    const response = await axios.get(`https://api.chonglianlian.online/api/download/${taskId}`, {
      responseType: 'arraybuffer'
    })

    // 保存到用户下载目录
    const downloadsPath = app.getPath('downloads')
    const fileName = `petlink-report-${new Date().toISOString().split('T')[0]}.pdf`
    const filePath = path.join(downloadsPath, fileName)

    fs.writeFileSync(filePath, response.data)
    return { success: true, filePath }
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message)
  }
})
```

### 2. Electron 渲染进程示例

```javascript
// renderer.js
const { ipcRenderer } = require('electron')

class PetLinkElectronAPI {
  async uploadFile(filePath, mode = '健康关注') {
    return await ipcRenderer.invoke('upload-file', filePath, mode)
  }

  async getStatus(taskId) {
    return await ipcRenderer.invoke('get-status', taskId)
  }

  async downloadReport(taskId) {
    return await ipcRenderer.invoke('download-report', taskId)
  }

  async analyzeFile(filePath, mode = '健康关注', onProgress) {
    try {
      // 1. 上传文件
      const uploadResult = await this.uploadFile(filePath, mode)
      const taskId = uploadResult.task_id

      // 2. 轮询状态
      return new Promise((resolve, reject) => {
        const checkStatus = async () => {
          try {
            const status = await this.getStatus(taskId)

            if (onProgress) {
              onProgress(status)
            }

            if (status.status === 'completed') {
              // 3. 下载报告
              const downloadResult = await this.downloadReport(taskId)
              resolve({
                taskId,
                ...downloadResult,
                status
              })
            } else if (status.status === 'failed') {
              reject(new Error('分析失败'))
            } else {
              // 继续轮询
              setTimeout(checkStatus, 2000)
            }
          } catch (error) {
            reject(error)
          }
        }

        checkStatus()
      })
    } catch (error) {
      throw error
    }
  }
}

// 使用示例
const petlink = new PetLinkElectronAPI()

// 文件选择处理
document.getElementById('selectFileBtn').addEventListener('click', async () => {
  const { dialog } = require('electron').remote

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Word Documents', extensions: ['doc', 'docx'] }]
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]

    try {
      console.log('开始分析...')

      const analysisResult = await petlink.analyzeFile(filePath, '健康关注', (status) => {
        console.log(`进度: ${status.progress}% - ${status.message}`)
        // 更新UI显示进度
        updateProgressUI(status)
      })

      console.log('分析完成!', analysisResult)
      alert(`报告已下载到: ${analysisResult.filePath}`)
    } catch (error) {
      console.error('分析失败:', error)
      alert('分析失败: ' + error.message)
    }
  }
})

function updateProgressUI(status) {
  const progressBar = document.getElementById('progressBar')
  const statusText = document.getElementById('statusText')

  if (progressBar) {
    progressBar.style.width = `${status.progress}%`
    progressBar.setAttribute('aria-valuenow', status.progress)
  }

  if (statusText) {
    statusText.textContent = status.message
  }
}
```

### 3. HTML 界面示例

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>PetLink 宠物健康分析系统</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <style>
      .upload-area {
        border: 2px dashed #ccc;
        border-radius: 10px;
        padding: 50px;
        text-align: center;
        margin: 20px;
        transition: border-color 0.3s;
      }
      .upload-area:hover {
        border-color: #007bff;
      }
      .upload-area.dragover {
        border-color: #007bff;
        background-color: #f8f9fa;
      }
      .progress-container {
        margin: 20px;
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title">PetLink 宠物健康分析系统</h4>
            </div>
            <div class="card-body">
              <!-- 文件上传区域 -->
              <div id="uploadArea" class="upload-area">
                <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                <h5>拖拽文件到此处或点击选择文件</h5>
                <p class="text-muted">支持 .doc, .docx 格式</p>
                <button id="selectFileBtn" class="btn btn-primary">选择文件</button>
                <input type="file" id="fileInput" accept=".doc,.docx" style="display: none;" />
              </div>

              <!-- 进度显示区域 -->
              <div id="progressContainer" class="progress-container">
                <div class="mb-3">
                  <div class="d-flex justify-content-between mb-1">
                    <span>分析进度</span>
                    <span id="progressText">0%</span>
                  </div>
                  <div class="progress">
                    <div
                      id="progressBar"
                      class="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style="width: 0%"
                      aria-valuenow="0"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
                <div class="alert alert-info">
                  <i class="fas fa-info-circle"></i>
                  <span id="statusText">准备就绪</span>
                </div>
              </div>

              <!-- 结果显示区域 -->
              <div id="resultContainer" style="display: none;">
                <div class="alert alert-success">
                  <h5><i class="fas fa-check-circle"></i> 分析完成！</h5>
                  <p>报告已保存到您的下载文件夹。</p>
                  <button id="openFileBtn" class="btn btn-success">
                    <i class="fas fa-folder-open"></i> 打开报告
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="renderer.js"></script>
  </body>
</html>
```

### 4. 使用 Electron 的 net 模块替代方案

```javascript
// 如果不想使用 axios，可以使用 Electron 的 net 模块
const { net } = require('electron')

class PetLinkNetAPI {
  async uploadFile(filePath, mode = '健康关注') {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', fs.createReadStream(filePath))
      formData.append('mode', mode)

      const request = net.request({
        method: 'POST',
        url: 'https://api.chonglianlian.online/api/upload'
      })

      request.on('response', (response) => {
        let data = ''

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (error) {
            reject(new Error('Invalid JSON response'))
          }
        })
      })

      request.on('error', (error) => {
        reject(error)
      })

      // 写入 form 数据
      const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2)
      let body = ''

      // 添加 mode 字段
      body += `--${boundary}\r\n`
      body += 'Content-Disposition: form-data; name="mode"\r\n\r\n'
      body += `${mode}\r\n`

      // 添加 file 字段
      body += `--${boundary}\r\n`
      body += `Content-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\n`
      body +=
        'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n'

      request.setHeader('Content-Type', `multipart/form-data; boundary=${boundary}`)

      // 写入头部和文件内容
      request.write(body)
      const fileStream = fs.createReadStream(filePath)
      fileStream.pipe(request, { end: false })

      fileStream.on('end', () => {
        request.end(`\r\n--${boundary}--\r\n`)
      })
    })
  }
}
```

### 5. 基础JavaScript示例（网页版）

```javascript
class PetLinkAPI {
  constructor(baseUrl = 'https://api.chonglianlian.online') {
    this.baseUrl = baseUrl
  }

  // 上传文件
  async uploadFile(file, mode = '健康关注') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`)
    }

    return await response.json()
  }

  // 查询状态
  async getStatus(taskId) {
    const response = await fetch(`${this.baseUrl}/api/status/${taskId}`)

    if (!response.ok) {
      throw new Error(`查询状态失败: ${response.statusText}`)
    }

    return await response.json()
  }

  // 下载报告
  async downloadReport(taskId) {
    const response = await fetch(`${this.baseUrl}/api/download/${taskId}`)

    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`)
    }

    return await response.blob()
  }

  // 完整分析流程
  async analyzeFile(file, mode = '健康关注', onProgress) {
    try {
      // 1. 上传文件
      const uploadResult = await this.uploadFile(file, mode)
      const taskId = uploadResult.task_id

      // 2. 轮询状态
      return new Promise((resolve, reject) => {
        const checkStatus = async () => {
          try {
            const status = await this.getStatus(taskId)

            if (onProgress) {
              onProgress(status)
            }

            if (status.status === 'completed') {
              // 3. 下载报告
              const reportBlob = await this.downloadReport(taskId)
              resolve({
                taskId,
                reportBlob,
                status
              })
            } else if (status.status === 'failed') {
              reject(new Error('分析失败'))
            } else {
              // 继续轮询
              setTimeout(checkStatus, 2000)
            }
          } catch (error) {
            reject(error)
          }
        }

        checkStatus()
      })
    } catch (error) {
      throw error
    }
  }
}

// 使用示例
const petlink = new PetLinkAPI()

// 文件上传处理
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    console.log('开始分析...')

    const result = await petlink.analyzeFile(file, '健康关注', (status) => {
      console.log(`进度: ${status.progress}% - ${status.message}`)
    })

    console.log('分析完成!', result)

    // 下载文件
    const url = URL.createObjectURL(result.reportBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `宠物健康报告-${new Date().toISOString().split('T')[0]}.pdf`
    a.click()
  } catch (error) {
    console.error('分析失败:', error)
    alert('分析失败: ' + error.message)
  }
})
```

### 2. React Hook 示例

```javascript
// usePetLink.js
import { useState, useCallback } from 'react'

const usePetLink = (baseUrl = 'https://api.chonglianlian.online') => {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const analyzeFile = useCallback(
    async (file, mode = '健康关注') => {
      setLoading(true)
      setProgress(0)
      setMessage('准备上传文件...')

      try {
        // 上传文件
        const formData = new FormData()
        formData.append('file', file)
        formData.append('mode', mode)

        const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('文件上传失败')
        }

        const { task_id } = await uploadResponse.json()
        setMessage('开始AI分析...')

        // 轮询状态
        return new Promise((resolve, reject) => {
          const checkStatus = async () => {
            try {
              const statusResponse = await fetch(`${baseUrl}/api/status/${task_id}`)

              if (!statusResponse.ok) {
                throw new Error('状态查询失败')
              }

              const status = await statusResponse.json()
              setProgress(status.progress)
              setMessage(status.message)

              if (status.status === 'completed') {
                // 下载报告
                const downloadResponse = await fetch(`${baseUrl}/api/download/${task_id}`)
                const blob = await downloadResponse.blob()

                setLoading(false)
                resolve({
                  taskId: task_id,
                  blob,
                  filename: `宠物健康报告-${new Date().toISOString().split('T')[0]}.pdf`
                })
              } else if (status.status === 'failed') {
                setLoading(false)
                reject(new Error('分析失败'))
              } else {
                setTimeout(checkStatus, 2000)
              }
            } catch (error) {
              setLoading(false)
              reject(error)
            }
          }

          checkStatus()
        })
      } catch (error) {
        setLoading(false)
        throw error
      }
    },
    [baseUrl]
  )

  return {
    analyzeFile,
    loading,
    progress,
    message
  }
}

export default usePetLink
```

### 3. Vue Composition API 示例

```javascript
// usePetLink.js
import { ref } from 'vue'

export function usePetLink(baseUrl = 'https://api.chonglianlian.online') {
  const loading = ref(false)
  const progress = ref(0)
  const message = ref('')
  const error = ref(null)

  const analyzeFile = async (file, mode = '健康关注') => {
    loading.value = true
    progress.value = 0
    message.value = '准备上传文件...'
    error.value = null

    try {
      // 上传文件
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)

      const uploadResponse = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败')
      }

      const { task_id } = await uploadResponse.json()
      message.value = '开始AI分析...'

      // 轮询状态
      return new Promise((resolve, reject) => {
        const checkStatus = async () => {
          try {
            const statusResponse = await fetch(`${baseUrl}/api/status/${task_id}`)

            if (!statusResponse.ok) {
              throw new Error('状态查询失败')
            }

            const status = await statusResponse.json()
            progress.value = status.progress
            message.value = status.message

            if (status.status === 'completed') {
              // 下载报告
              const downloadResponse = await fetch(`${baseUrl}/api/download/${task_id}`)
              const blob = await downloadResponse.blob()

              loading.value = false
              resolve({
                taskId: task_id,
                blob,
                filename: `宠物健康报告-${new Date().toISOString().split('T')[0]}.pdf`
              })
            } else if (status.status === 'failed') {
              loading.value = false
              reject(new Error('分析失败'))
            } else {
              setTimeout(checkStatus, 2000)
            }
          } catch (err) {
            loading.value = false
            error.value = err.message
            reject(err)
          }
        }

        checkStatus()
      })
    } catch (err) {
      loading.value = false
      error.value = err.message
      throw err
    }
  }

  return {
    analyzeFile,
    loading,
    progress,
    message,
    error
  }
}
```

## 文件要求

### 支持的文件格式

- `.doc` - Word文档
- `.docx` - Word文档（推荐）

### 文件大小限制

- 最大文件大小：10MB
- 建议文件大小：小于5MB

### 文件内容建议

- 包含宠物基本信息
- 包含体检数据
- 包含兽医诊断意见
- 文本清晰可读

## 错误处理

### 常见错误代码

| HTTP状态码 | 错误类型              | 说明           |
| ---------- | --------------------- | -------------- |
| 400        | Bad Request           | 请求参数错误   |
| 422        | Validation Error      | 数据验证失败   |
| 500        | Internal Server Error | 服务器内部错误 |

### 错误处理示例

```javascript
try {
  const result = await petlink.analyzeFile(file)
} catch (error) {
  if (error.message.includes('上传失败')) {
    // 处理上传错误
    alert('文件上传失败，请检查文件格式和大小')
  } else if (error.message.includes('分析失败')) {
    // 处理分析错误
    alert('AI分析失败，请稍后重试')
  } else {
    // 处理其他错误
    alert('发生错误: ' + error.message)
  }
}
```

## 性能优化建议

### 1. 文件上传优化

- 添加文件大小和格式验证
- 显示上传进度条
- 支持拖拽上传

### 2. 用户体验优化

- 添加加载状态显示
- 实现进度条动画
- 提供取消功能

### 3. 错误处理优化

- 友好的错误提示
- 重试机制
- 日志记录

## Electron 应用特殊配置

### 1. package.json 配置

```json
{
  "name": "petlink-desktop",
  "version": "1.0.0",
  "description": "PetLink 宠物健康分析桌面应用",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "dev": "electron ."
  },
  "dependencies": {
    "axios": "^0.24.0",
    "electron": "^13.0.0",
    "form-data": "^4.0.0"
  },
  "devDependencies": {
    "electron-builder": "^22.11.7"
  },
  "build": {
    "appId": "com.petlink.desktop",
    "productName": "PetLink 宠物健康分析",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!**/node_modules/*.d.ts",
      "!**/node_modules/.bin",
      "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
      "!.editorconfig",
      "!**/._*",
      "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
      "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
      "!**/{appveyor.yml,.travis.yml,circle.yml}",
      "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
    ],
    "mac": {
      "category": "public.app-category.medical"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### 2. 安全注意事项

```javascript
// 在主进程中设置安全策略
mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 生产环境建议关闭
    contextIsolation: true, // 启用上下文隔离
    enableRemoteModule: false, // 禁用 remote 模块
    webSecurity: true, // 启用 web 安全
    allowRunningInsecureContent: false
  }
})
```

### 3. 错误处理和日志

```javascript
// main.js - 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // 记录错误到文件
  const logPath = path.join(app.getPath('userData'), 'error.log')
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${error.stack}\n`)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
```

### 4. 自动更新功能

```javascript
const { autoUpdater } = require('electron-updater')

// 检查更新
function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify()
}

// 在应用就绪时检查更新
app.whenReady().then(() => {
  createWindow()
  checkForUpdates()
})

// 自动更新事件
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update-available')
})

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-downloaded')
})
```

## Electron 开发最佳实践

### 1. 文件处理优化

- 使用 Electron 的 `dialog` 模块选择文件
- 使用 `fs` 模块处理大文件
- 实现文件拖拽功能

### 2. 网络请求优化

- 使用主进程处理网络请求（避免 CORS）
- 实现请求重试机制
- 添加请求超时处理

### 3. 用户体验优化

- 添加应用图标和启动画面
- 实现系统托盘功能
- 支持快捷键操作

### 4. 性能优化

- 使用 BrowserWindow 的 `preload` 脚本
- 合理使用缓存策略
- 避免内存泄漏

## 常见问题解答

### Q: 支持哪些文件格式？

A: 目前支持 `.doc` 和 `.docx` 格式的Word文档。

### Q: 文件大小有限制吗？

A: 单个文件最大10MB，建议小于5MB。

### Q: 分析需要多长时间？

A: 通常需要1-5分钟，取决于文件大小和服务器负载。

### Q: 如何取消正在进行的分析？

A: 目前不支持取消，建议在任务完成后清理文件。

### Q: 分析结果的准确性如何？

A: 基于AI模型进行分析，提供参考意见，不能替代专业兽医诊断。

### Q: Electron 应用如何打包发布？

A: 使用 `electron-builder` 或 `electron-packager` 进行打包，支持 Windows、macOS、Linux 平台。

### Q: 如何处理跨域问题？

A: Electron 应用默认不受 CORS 限制，可以直接访问后端 API。

### Q: 如何实现离线功能？

A: 可以使用 Service Worker 和 IndexedDB 实现部分离线功能，但 AI 分析需要网络连接。

## 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 支持文件上传和AI分析
- 支持PDF报告生成和下载

## 技术支持

如有问题，请联系开发团队或提交Issue。

---

_最后更新: 2024-01-01_
