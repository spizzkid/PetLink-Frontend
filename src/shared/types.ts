// �i�o{�
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

// �7�o{�
export interface Client {
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

// e���U{�
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
  petName?: string
  petType?: string
  ownerName?: string
}

// �{�
export interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

// AI �J{�
export interface AiReport {
  id: string
  healthCheckId: string
  reportType: 'analysis' | 'recommendation' | 'summary'
  content: string
  confidence: number
  suggestions: string[]
  generatedAt: Date
}

// AI J)�U{�
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

// �}�{�
export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  error?: string
}

// UI �{�
export interface UIState {
  sidebarCollapsed: boolean
  activeMenu: string
  theme: 'dark' | 'light'
  notifications: Notification[]
}

// �{�
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  createdAt: Date
}

// u{�
export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

// "���{�
export interface SearchFilters {
  query?: string
  type?: string
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// API ͔{�
export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  timestamp: Date
}

// hUpn{�
export interface FormData {
  [key: string]: unknown
}
