import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 类型定义
interface AdminStats {
  total_users: number
  total_clients: number
  total_pets: number
  active_users: number
  last_updated: string
}

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'store'
  is_active: boolean
  created_at: string
}

// HTTP API 客户端
type Role = 'admin' | 'store'

interface RegisterData {
  username: string
  email: string
  password: string
  name: string
  phone: string
  role?: Role
}

// (payload interfaces removed; using domain models below and Partial<T> where needed)

interface ApiLoginResult {
  detail?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = 'https://api.chonglianlian.online/api/v1') {
    this.baseUrl = baseUrl
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    console.log('API Request:', url)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    try {
      // 走主进程 axios（通过 IPC）
      const res = await ipcRenderer.invoke('api:request', {
        url,
        method: options.method ?? 'GET',
        headers,
        body: options.body,
        responseType: 'json'
      })

      if (!res?.ok) {
        // 更详细的错误信息
        const errorMsg = res?.error || res?.data?.detail || `HTTP ${res?.status || 'Unknown'}`
        console.error('API Error Details:', res)
        throw new Error(errorMsg)
      }

      return res.data as T
    } catch (error) {
      console.error(`API Request failed: ${url}`, error)
      throw error
    }
  }

  // 认证相关 - 已注释
  // async login(username: string, password: string): Promise<ApiLoginResult> {
  //   console.log('Starting login process')
  //   const result = await this.request<ApiLoginResult>('/auth/login', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //     body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  //   })
  //   console.log('Login response:', result)
  //   return result
  // }

  // 临时登录方法 - 直接返回成功
  async login(username: string, password: string): Promise<ApiLoginResult> {
    console.log('Login bypassed - no authentication required')
    return { detail: 'Login successful - no auth required' }
  }

  async register(userData: RegisterData): Promise<ApiResponse<unknown>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  // 管理员相关
  async getStats(): Promise<ApiResponse<AdminStats>> {
    return this.request('/admin/stats')
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/admin/users')
  }

  // 客户相关
  async getClients(): Promise<ApiResponse<Client[]>> {
    return this.request('/clients')
  }

  async createClient(clientData: Partial<Client>): Promise<ApiResponse<Client>> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    })
  }

  // 宠物相关
  async getPets(): Promise<ApiResponse<Pet[]>> {
    return this.request('/pets')
  }

  async createPet(petData: Partial<Pet>): Promise<ApiResponse<Pet>> {
    return this.request('/pets', {
      method: 'POST',
      body: JSON.stringify(petData)
    })
  }

  // 健康检查相关
  async getHealthChecks(): Promise<ApiResponse<HealthCheck[]>> {
    return this.request('/health-checks')
  }

  async createHealthCheck(checkData: Partial<HealthCheck>): Promise<ApiResponse<HealthCheck>> {
    return this.request('/health-checks', {
      method: 'POST',
      body: JSON.stringify(checkData)
    })
  }

  // AI报告相关
  async getAiReports(): Promise<ApiResponse<unknown>> {
    return this.request('/ai-reports')
  }

  async createAiReport(reportData: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request('/ai-reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    })
  }
}

// 客户信息类型
interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  pet_count?: number
}

// 宠物信息类型
interface Pet {
  id: string
  name: string
  type: 'dog' | 'cat' | 'horse' | 'other'
  breed: string
  age: number
  weight: number
  gender: 'male' | 'female'
  ownerId: string
  ownerName?: string
  avatar?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// 健康检查记录类型
interface HealthCheck {
  id: string
  petId: string
  checkDate: Date
  checkType: 'routine' | 'vaccination' | 'skin' | 'specialized' | 'emergency'
  veterinarian: string
  weight: number
  temperature: number
  heartRate: number
  symptoms: string[]
  diagnosis: string
  treatment: string
  notes?: string
  followUpDate?: Date
  status: 'completed' | 'in_progress' | 'scheduled' | 'cancelled'
  reportUrl?: string
  reportPath?: string
  reportFilename?: string
  reportUploadedAt?: Date
  createdAt: Date
  updatedAt: Date
  petName?: string
  petType?: string
  ownerName?: string
}

// 处方信息类型
interface Prescription {
  id: string
  petId: string
  medicine: string
  dosage: string
  startDate: Date
  endDate: Date
  notes?: string
}

// API 响应类型
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 统计数据类型
interface Stats {
  totalClients: number
  totalPets: number
  totalHealthChecks: number
  healthChecksThisMonth: number
  newClientsThisMonth: number
  petTypeDistribution: Array<{ type: string; count: number }>
  checkTypeDistribution: Array<{ check_type: string; count: number }>
}

// 备份项类型
interface BackupItem {
  path: string
  name: string
  size: number
  date: string
}

// 存储信息类型
interface StorageInfo {
  totalSize: number
  dbSize: number
  backupSize: number
  exportSize: number
  dbPath: string
  backupPath: string
  exportPath: string
}

// 数据库完整性检查结果类型
interface IntegrityCheckResult {
  isValid: boolean
  message: string
}

// 数据同步相关类型
interface SyncData {
  clients: Client[]
  pets: Pet[]
  healthChecks: HealthCheck[]
  prescriptions: Prescription[]
  exportedAt: string
}

interface SyncStats {
  clients: number
  pets: number
  healthChecks: number
  prescriptions: number
  total: number
}

// Database API types
interface DatabaseAPI {
  // Auth operations
  login: (username: string, password: string) => Promise<ApiLoginResult>
  register: (userData: RegisterData) => Promise<ApiResponse<unknown>>


  // Admin operations
  getAdminStats: () => Promise<ApiResponse<AdminStats>>
  getUsers: () => Promise<ApiResponse<User[]>>
  // Client operations
  getClients: () => Promise<ApiResponse<Client[]>>
  getClientById: (id: string) => Promise<ApiResponse<Client>>
  createClient: (data: Partial<Client>) => Promise<ApiResponse<Client>>
  updateClient: (id: string, data: Partial<Client>) => Promise<ApiResponse<Client>>
  deleteClient: (id: string) => Promise<ApiResponse<boolean>>
  searchClients: (query: string) => Promise<ApiResponse<Client[]>>

  // Pet operations
  getPets: () => Promise<ApiResponse<Pet[]>>
  getPetById: (id: string) => Promise<ApiResponse<Pet>>
  getPetsByOwner: (ownerId: string) => Promise<ApiResponse<Pet[]>>
  createPet: (data: Partial<Pet>) => Promise<ApiResponse<Pet>>
  updatePet: (id: string, data: Partial<Pet>) => Promise<ApiResponse<Pet>>
  deletePet: (id: string) => Promise<ApiResponse<boolean>>
  searchPets: (query: string) => Promise<ApiResponse<Pet[]>>

  // Health check operations
  getHealthChecks: () => Promise<ApiResponse<HealthCheck[]>>
  getHealthCheckById: (id: string) => Promise<ApiResponse<HealthCheck>>
  getHealthChecksByPet: (petId: string) => Promise<ApiResponse<HealthCheck[]>>
  createHealthCheck: (data: Partial<HealthCheck>) => Promise<ApiResponse<HealthCheck>>
  updateHealthCheck: (id: string, data: Partial<HealthCheck>) => Promise<ApiResponse<HealthCheck>>
  deleteHealthCheck: (id: string) => Promise<ApiResponse<boolean>>
  searchHealthChecks: (query: string) => Promise<ApiResponse<HealthCheck[]>>

  // AI Report operations
  getAiReports: () => Promise<ApiResponse<unknown>>
  getAiReportById: (id: string) => Promise<ApiResponse<unknown>>
  getAiReportsByPet: (petId: string) => Promise<ApiResponse<unknown>>
  createAiReport: (data: Record<string, unknown>) => Promise<ApiResponse<unknown>>
  updateAiReport: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<unknown>>
  deleteAiReport: (id: string) => Promise<ApiResponse<unknown>>

  // Prescription operations
  getPrescriptions: () => Promise<ApiResponse<Prescription[]>>
  getPrescriptionById: (id: string) => Promise<ApiResponse<Prescription>>
  getPrescriptionsByPet: (petId: string) => Promise<ApiResponse<Prescription[]>>
  createPrescription: (data: Partial<Prescription>) => Promise<ApiResponse<Prescription>>
  updatePrescription: (
    id: string,
    data: Partial<Prescription>
  ) => Promise<ApiResponse<Prescription>>
  deletePrescription: (id: string) => Promise<ApiResponse<boolean>>
  searchPrescriptions: (query: string) => Promise<ApiResponse<Prescription[]>>

  // Stats operations
  getStats: () => Promise<ApiResponse<Stats>>

  // Backup operations
  createBackup: () => Promise<ApiResponse<string>>
  restoreBackup: (backupPath: string) => Promise<ApiResponse<string>>
  exportData: () => Promise<ApiResponse<string>>
  importData: (importPath: string) => Promise<ApiResponse<string>>
  getBackupList: () => Promise<ApiResponse<BackupItem[]>>
  deleteBackup: (backupPath: string) => Promise<ApiResponse<string>>
  cleanupOldBackups: (keepCount?: number) => Promise<ApiResponse<string>>
  getStorageInfo: () => Promise<ApiResponse<StorageInfo>>
  checkDatabaseIntegrity: () => Promise<ApiResponse<IntegrityCheckResult>>
  openPath: (path: string) => Promise<void>

  // Sync operations
  exportSyncData: () => Promise<ApiResponse<SyncData>>
  getSyncStats: () => Promise<ApiResponse<SyncStats>>
  clearLocalData: () => Promise<ApiResponse<boolean>>

  // Network diagnostics
  testDNS: (
    hostname: string
  ) => Promise<{ success: boolean; address?: string; family?: number; error?: string }>
  testConnection: (url: string) => Promise<{
    success: boolean
    status?: number
    statusText?: string
    error?: string
    code?: string
  }>
}

// 创建HTTP API客户端实例 - 云端地址 (HTTPS)
const apiClient = new ApiClient('https://api.chonglianlian.online/api/v1')

// Custom APIs for renderer - 使用本地SQLite数据库
const api: DatabaseAPI = {
  // 认证相关 - 已注释，使用本地数据库
  // login: (username: string, password: string) => apiClient.login(username, password),
  // register: (userData: RegisterData) => apiClient.register(userData),
  login: (username: string, password: string) => Promise.resolve({ detail: 'Local database - no auth required' }),
  register: (userData: RegisterData) => Promise.resolve({ success: true, data: {} }),

  // Admin operations - 使用本地SQLite
  getAdminStats: () => ipcRenderer.invoke('db:getStats'),
  getUsers: () => Promise.resolve({ success: true, data: [] }), // 暂不实现用户管理

  // Client operations - 使用本地SQLite
  getClients: () => ipcRenderer.invoke('db:getClients'),
  getClientById: (id: string) => ipcRenderer.invoke('db:getClientById', id),
  createClient: (data: Partial<Client>) => ipcRenderer.invoke('db:createClient', data),
  updateClient: (id: string, data: Partial<Client>) => ipcRenderer.invoke('db:updateClient', id, data),
  deleteClient: (id: string) => ipcRenderer.invoke('db:deleteClient', id),
  searchClients: (query: string) => ipcRenderer.invoke('db:searchClients', query),

  // Pet operations - 使用本地SQLite
  getPets: () => ipcRenderer.invoke('db:getPets'),
  getPetById: (id: string) => ipcRenderer.invoke('db:getPetById', id),
  getPetsByOwner: (ownerId: string) => ipcRenderer.invoke('db:getPetsByOwner', ownerId),
  createPet: (data: Partial<Pet>) => ipcRenderer.invoke('db:createPet', data),
  updatePet: (id: string, data: Partial<Pet>) => ipcRenderer.invoke('db:updatePet', id, data),
  deletePet: (id: string) => ipcRenderer.invoke('db:deletePet', id),
  searchPets: (query: string) => ipcRenderer.invoke('db:searchPets', query),

  // Health check operations - 使用本地SQLite
  getHealthChecks: () => ipcRenderer.invoke('db:getHealthChecks'),
  getHealthCheckById: (id: string) => ipcRenderer.invoke('db:getHealthCheckById', id),
  getHealthChecksByPet: (petId: string) => ipcRenderer.invoke('db:getHealthChecksByPet', petId),
  createHealthCheck: (data: Partial<HealthCheck>) => ipcRenderer.invoke('db:createHealthCheck', data),
  updateHealthCheck: (id: string, data: Partial<HealthCheck>) => ipcRenderer.invoke('db:updateHealthCheck', id, data),
  deleteHealthCheck: (id: string) => ipcRenderer.invoke('db:deleteHealthCheck', id),
  searchHealthChecks: (query: string) => Promise.resolve({ success: true, data: [] }), // 暂不实现搜索

  // AI report operations - 暂不实现
  getAiReports: () => Promise.resolve({ success: true, data: [] }),
  getAiReportById: (id: string) => Promise.resolve({ success: true, data: null }),
  getAiReportsByPet: (petId: string) => Promise.resolve({ success: true, data: [] }),
  createAiReport: (data: Record<string, unknown>) => Promise.resolve({ success: true, data: {} }),
  updateAiReport: (id: string, data: Record<string, unknown>) => Promise.resolve({ success: true, data: {} }),
  deleteAiReport: (id: string) => Promise.resolve({ success: true, data: true }),

  // Prescription operations - 暂不实现
  getPrescriptions: () => Promise.resolve({ success: true, data: [] }),
  getPrescriptionById: (id: string) => Promise.resolve({ success: true, data: null }),
  getPrescriptionsByPet: (petId: string) => Promise.resolve({ success: true, data: [] }),
  createPrescription: (data: Partial<Prescription>) => Promise.resolve({ success: true, data: {} }),
  updatePrescription: (id: string, data: Partial<Prescription>) => Promise.resolve({ success: true, data: {} }),
  deletePrescription: (id: string) => Promise.resolve({ success: true, data: true }),
  searchPrescriptions: (query: string) => Promise.resolve({ success: true, data: [] }),

  // Stats - 使用本地SQLite
  getStats: () => ipcRenderer.invoke('db:getStats'),

  // Backup operations - 保持本地IPC
  createBackup: () => ipcRenderer.invoke('create-backup'),
  restoreBackup: (backupPath: string) => ipcRenderer.invoke('restore-backup', backupPath),
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (importPath: string) => ipcRenderer.invoke('import-data', importPath),
  getBackupList: () => ipcRenderer.invoke('get-backup-list'),
  deleteBackup: (backupPath: string) => ipcRenderer.invoke('delete-backup', backupPath),
  cleanupOldBackups: (keepCount?: number) => ipcRenderer.invoke('cleanup-old-backups', keepCount),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  checkDatabaseIntegrity: () => ipcRenderer.invoke('check-database-integrity'),
  openPath: (path: string) => ipcRenderer.invoke('open-path', path),

  // Sync operations - 使用HTTP API
  exportSyncData: () => apiClient.request('/sync/export'),
  getSyncStats: () => apiClient.request('/sync/stats'),
  clearLocalData: () => ipcRenderer.invoke('clear-local-data'),

  // Network diagnostics
  testDNS: (hostname: string) => ipcRenderer.invoke('network:test-dns', hostname),
  testConnection: (url: string) => ipcRenderer.invoke('network:test-connection', url)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
