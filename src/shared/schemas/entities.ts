import { z } from 'zod'
import {
  IdSchema,
  NameSchema,
  PhoneSchema,
  WechatSchema,
  AddressSchema,
  NotesSchema,
  DateSchema,
  PetTypeSchema,
  GenderSchema,
  AgeSchema,
  WeightSchema,
  CheckTypeSchema,
  StatusSchema,
  TemperatureSchema,
  HeartRateSchema,
  SymptomsSchema,
  UrlSchema,
  FilePathSchema,
  ReportTypeSchema,
  ChatRoleSchema,
  NotificationTypeSchema
} from './base'

// 客户信息 Schema
export const ClientSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  phone: PhoneSchema,
  wechat: WechatSchema,
  address: AddressSchema,
  notes: NotesSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
})

// 创建客户 Schema（不包含 id 和时间戳）
export const CreateClientSchema = ClientSchema.omit({ id: true, createdAt: true, updatedAt: true })

// 更新客户 Schema（所有字段可选）
export const UpdateClientSchema = CreateClientSchema.partial()

// 宠物信息 Schema
export const PetSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  type: PetTypeSchema,
  breed: z.string().min(1).max(100),
  age: AgeSchema,
  weight: WeightSchema,
  gender: GenderSchema,
  ownerId: IdSchema,
  avatar: UrlSchema,
  notes: NotesSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
})

// 创建宠物 Schema
export const CreatePetSchema = PetSchema.omit({ id: true, createdAt: true, updatedAt: true })

// 更新宠物 Schema
export const UpdatePetSchema = CreatePetSchema.partial()

// 处方 Schema
export const PrescriptionSchema = z.object({
  id: IdSchema,
  medication: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  instructions: z.string().min(1).max(1000)
})

// 创建处方 Schema
export const CreatePrescriptionSchema = PrescriptionSchema.omit({ id: true })

// 健康检查记录 Schema
export const HealthCheckSchema = z.object({
  id: IdSchema,
  pet_id: IdSchema,
  check_date: DateSchema,
  check_type: CheckTypeSchema,
  veterinarian: NameSchema,
  weight: WeightSchema.optional(),
  temperature: TemperatureSchema.optional(),
  heart_rate: HeartRateSchema.optional(),
  symptoms: SymptomsSchema,
  diagnosis: z.string().min(1).max(1000),
  treatment: z.string().min(1).max(2000),
  prescriptions: z.array(PrescriptionSchema).optional(),
  notes: NotesSchema,
  follow_up_date: DateSchema.optional(),
  status: StatusSchema,
  report_url: UrlSchema,
  report_path: FilePathSchema,
  report_filename: z.string().max(255).optional(),
  report_uploaded_at: DateSchema.optional(),
  created_at: DateSchema,
  updated_at: DateSchema
})

// 创建健康检查 Schema
export const CreateHealthCheckSchema = HealthCheckSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reportUploadedAt: true
})

// 更新健康检查 Schema
export const UpdateHealthCheckSchema = CreateHealthCheckSchema.partial()

// AI 报告 Schema
export const AiReportSchema = z.object({
  id: IdSchema,
  healthCheckId: IdSchema,
  reportType: ReportTypeSchema,
  content: z.string().min(1).max(10000),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string().max(500)).default([]),
  generatedAt: DateSchema
})

// 创建 AI 报告 Schema
export const CreateAiReportSchema = AiReportSchema.omit({ id: true, generatedAt: true })

// AI 聊天记录 Schema
export const AiChatSchema = z.object({
  id: IdSchema,
  sessionId: IdSchema,
  role: ChatRoleSchema,
  content: z.string().min(1).max(5000),
  timestamp: DateSchema,
  context: z
    .object({
      petId: IdSchema.optional(),
      healthCheckId: IdSchema.optional(),
      reportId: IdSchema.optional()
    })
    .optional()
})

// 创建 AI 聊天记录 Schema
export const CreateAiChatSchema = AiChatSchema.omit({ id: true, timestamp: true })

// 通知 Schema
export const NotificationSchema = z.object({
  id: IdSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  duration: z.number().int().min(1000).max(10000).optional(),
  createdAt: DateSchema
})

// 创建通知 Schema
export const CreateNotificationSchema = NotificationSchema.omit({ id: true, createdAt: true })

// 加载状态 Schema
export const LoadingStateSchema = z.object({
  isLoading: z.boolean(),
  loadingText: z.string().max(100).optional(),
  error: z.string().max(500).optional()
})

// UI 状态 Schema
export const UIStateSchema = z.object({
  sidebarCollapsed: z.boolean(),
  activeMenu: z.string().max(50),
  theme: z.enum(['dark', 'light']),
  notifications: z.array(NotificationSchema)
})

// 表单验证错误 Schema
export const FormErrorSchema = z.object({
  field: z.string(),
  message: z.string()
})

// 批量操作 Schema
export const BulkOperationSchema = z.object({
  ids: z.array(IdSchema).min(1).max(100),
  operation: z.enum(['delete', 'archive', 'restore']),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  timestamp: z.string()
})

// 搜索结果 Schema
export const SearchResultSchema = z.object({
  id: IdSchema,
  type: z.enum(['client', 'pet', 'health_check']),
  title: z.string().max(200),
  description: z.string().max(500),
  url: z.string().url().optional(),
  score: z.number().min(0).max(1)
})

// 统计数据 Schema
export const StatsSchema = z.object({
  totalClients: z.number().int().min(0),
  totalPets: z.number().int().min(0),
  totalHealthChecks: z.number().int().min(0),
  monthlyRevenue: z.number().min(0),
  newClientsThisMonth: z.number().int().min(0),
  healthChecksThisMonth: z.number().int().min(0)
})

// BaseEntity 接口
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// 宠物信息扩展接口
export interface Pet extends BaseEntity {
  name: string
  type: string
  breed: string
  age: number
  weight: number
  gender: string
  ownerId: string
  avatar?: string
  notes?: string
}

// 健康检查记录扩展接口
export interface HealthCheck extends BaseEntity {
  petId: string
  checkDate: Date
  checkType: 'routine' | 'vaccination' | 'skin' | 'specialized' | 'emergency'
  veterinarian: string
  weight?: number
  temperature?: number
  heartRate?: number
  symptoms?: string[]
  diagnosis?: string
  treatment?: string
  notes?: string
  followUpDate?: Date
  status: 'completed' | 'in_progress' | 'scheduled' | 'cancelled'
  reportUrl?: string
  prescriptions?: unknown[]
}

// 统计数据接口
export interface AdminStats {
  total_users: number
  total_clients: number
  total_pets: number
  active_users: number
  last_updated: string
}

// 用户信息接口
export interface User extends BaseEntity {
  username: string
  email: string
  name: string
  role: 'admin' | 'store'
  is_active: boolean
}

/**
 * Represents a prescription for a pet.
 */
export interface Prescription {
  id: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}
