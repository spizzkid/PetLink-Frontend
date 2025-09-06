import { ElectronAPI } from '@electron-toolkit/preload'

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

// API 响应类型
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 管理员统计数据类型
interface AdminStats {
  total_users: number
  total_clients: number
  total_pets: number
  active_users: number
  last_updated: string
}

// 用户类型
interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'store'
  is_active: boolean
  created_at: string
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

// API 登录结果类型
interface ApiLoginResult {
  detail?: string
}

// 注册数据类型
interface RegisterData {
  username: string
  email: string
  password: string
  name: string
  phone: string
  role?: 'admin' | 'store'
}

interface DatabaseAPI {
  // Auth operations
  login: (username: string, password: string) => Promise<ApiLoginResult>
  register: (userData: RegisterData) => Promise<ApiResponse<Record<string, unknown>>>

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

declare global {
  interface Window {
    electron: ElectronAPI
    api: DatabaseAPI
  }
}
