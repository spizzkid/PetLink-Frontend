// 宠物信息类型
export interface Pet {
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

// 客户信息类型
export interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  // 从数据库连接中获取的额外字段
  pet_count?: number
}

// 健康检查记录类型
export interface HealthCheck {
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
  prescriptions?: Prescription[]
  notes?: string
  followUpDate?: Date
  status: 'completed' | 'in_progress' | 'scheduled' | 'cancelled'
  reportUrl?: string
  reportPath?: string
  reportFilename?: string
  reportUploadedAt?: Date
  createdAt: Date
  updatedAt: Date
  // 从数据库连接中获取的额外字段
  petName?: string
  petType?: string
  ownerName?: string
}

// 处方类型
export interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

// AI 报告类型
export interface AiReport {
  id: string
  healthCheckId: string
  reportType: 'analysis' | 'recommendation' | 'summary'
  content: string
  confidence: number
  suggestions: string[]
  generatedAt: Date
}

// AI 聊天记录类型
export interface AiChat {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: {
    petId?: string
    healthCheckId?: string
    reportId?: string
  }
}

// 加载状态类型
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  error?: string
}

// UI 状态类型
export interface UIState {
  sidebarCollapsed: boolean
  activeMenu: string
  theme: 'dark' | 'light'
  notifications: Notification[]
}

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  createdAt: Date
}

// 分页类型
export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

// 搜索和过滤类型
export interface SearchFilters {
  query?: string
  type?: string
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// API 响应类型
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: Date
}

// 表单数据类型
export interface FormData {
  [key: string]: unknown
}
