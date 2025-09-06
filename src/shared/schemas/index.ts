// 导出所有 Schema 相关的类型和工具函数
import { z, type infer as ZodInfer } from 'zod'

// 基础 Schema 导出
export * from './base'

// 实体 Schema 导出
export * from './entities'

// API Schema 导出
export * from './api'

// 类型推断工具
export type Client = ZodInfer<typeof import('./entities').ClientSchema>
export type Pet = ZodInfer<typeof import('./entities').PetSchema>
export type HealthCheck = ZodInfer<typeof import('./entities').HealthCheckSchema>
export type Prescription = ZodInfer<typeof import('./entities').PrescriptionSchema>
export type AiReport = ZodInfer<typeof import('./entities').AiReportSchema>
export type AiChat = ZodInfer<typeof import('./entities').AiChatSchema>
export type Notification = ZodInfer<typeof import('./entities').NotificationSchema>

// API 请求/响应类型推断
export type GetClientsRequest = ZodInfer<typeof import('./api').GetClientsRequestSchema>
export type GetClientsResponse = ZodInfer<typeof import('./api').GetClientsResponseSchema>
export type CreateClientRequest = ZodInfer<typeof import('./api').CreateClientRequestSchema>
export type CreateClientResponse = ZodInfer<typeof import('./api').CreateClientResponseSchema>
export type UpdateClientRequest = ZodInfer<typeof import('./api').UpdateClientRequestSchema>
export type UpdateClientResponse = ZodInfer<typeof import('./api').UpdateClientResponseSchema>
export type DeleteClientRequest = ZodInfer<typeof import('./api').DeleteClientRequestSchema>
export type DeleteClientResponse = ZodInfer<typeof import('./api').DeleteClientResponseSchema>

export type GetPetsRequest = ZodInfer<typeof import('./api').GetPetsRequestSchema>
export type GetPetsResponse = ZodInfer<typeof import('./api').GetPetsResponseSchema>
export type CreatePetRequest = ZodInfer<typeof import('./api').CreatePetRequestSchema>
export type CreatePetResponse = ZodInfer<typeof import('./api').CreatePetResponseSchema>
export type UpdatePetRequest = ZodInfer<typeof import('./api').UpdatePetRequestSchema>
export type UpdatePetResponse = ZodInfer<typeof import('./api').UpdatePetResponseSchema>
export type DeletePetRequest = ZodInfer<typeof import('./api').DeletePetRequestSchema>
export type DeletePetResponse = ZodInfer<typeof import('./api').DeletePetResponseSchema>

export type GetHealthChecksRequest = ZodInfer<typeof import('./api').GetHealthChecksRequestSchema>
export type GetHealthChecksResponse = ZodInfer<typeof import('./api').GetHealthChecksResponseSchema>
export type CreateHealthCheckRequest = ZodInfer<
  typeof import('./api').CreateHealthCheckRequestSchema
>
export type CreateHealthCheckResponse = ZodInfer<
  typeof import('./api').CreateHealthCheckResponseSchema
>
export type UpdateHealthCheckRequest = ZodInfer<
  typeof import('./api').UpdateHealthCheckRequestSchema
>
export type UpdateHealthCheckResponse = ZodInfer<
  typeof import('./api').UpdateHealthCheckResponseSchema
>
export type DeleteHealthCheckRequest = ZodInfer<
  typeof import('./api').DeleteHealthCheckRequestSchema
>
export type DeleteHealthCheckResponse = ZodInfer<
  typeof import('./api').DeleteHealthCheckResponseSchema
>

export type AiChatRequest = ZodInfer<typeof import('./api').AiChatRequestSchema>
export type AiChatResponse = ZodInfer<typeof import('./api').AiChatResponseSchema>
export type GenerateAiReportRequest = ZodInfer<typeof import('./api').GenerateAiReportRequestSchema>
export type GenerateAiReportResponse = ZodInfer<
  typeof import('./api').GenerateAiReportResponseSchema
>

// 验证工具函数
export const validateSchema = <T>(schema: import('zod').ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`)
  }
  return result.data
}

// 安全解析函数（返回错误信息而不是抛出异常）
export const safeParseSchema = <T>(
  schema: import('zod').ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error.message }
  }
}

// 表单验证工具
export const validateFormData = <T>(
  schema: import('zod').ZodSchema<T>,
  formData: Record<string, unknown>
): { valid: true; data: T } | { valid: false; errors: Record<string, string> } => {
  const result = schema.safeParse(formData)
  if (result.success) {
    return { valid: true, data: result.data }
  } else {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      errors[path] = issue.message
    })
    return { valid: false, errors }
  }
}

// 批量验证工具
export const validateBatch = <T>(
  schema: import('zod').ZodSchema<T>,
  dataArray: unknown[]
): { valid: T[]; invalid: Array<{ data: unknown; error: string }> } => {
  const valid: T[] = []
  const invalid: Array<{ data: unknown; error: string }> = []

  dataArray.forEach((data) => {
    const result = schema.safeParse(data)
    if (result.success) {
      valid.push(result.data)
    } else {
      invalid.push({
        data,
        error: result.error.message
      })
    }
  })

  return { valid, invalid }
}

// Schema 注册表（用于动态获取 Schema）
export const SchemaRegistry = {
  // 实体 Schema
  Client: () => import('./entities').then((m) => m.ClientSchema),
  Pet: () => import('./entities').then((m) => m.PetSchema),
  HealthCheck: () => import('./entities').then((m) => m.HealthCheckSchema),
  Prescription: () => import('./entities').then((m) => m.PrescriptionSchema),
  AiReport: () => import('./entities').then((m) => m.AiReportSchema),
  AiChat: () => import('./entities').then((m) => m.AiChatSchema),
  Notification: () => import('./entities').then((m) => m.NotificationSchema),

  // API 请求 Schema
  CreateClientRequest: () => import('./api').then((m) => m.CreateClientRequestSchema),
  UpdateClientRequest: () => import('./api').then((m) => m.UpdateClientRequestSchema),
  CreatePetRequest: () => import('./api').then((m) => m.CreatePetRequestSchema),
  UpdatePetRequest: () => import('./api').then((m) => m.UpdatePetRequestSchema),
  CreateHealthCheckRequest: () => import('./api').then((m) => m.CreateHealthCheckRequestSchema),
  UpdateHealthCheckRequest: () => import('./api').then((m) => m.UpdateHealthCheckRequestSchema),
  AiChatRequest: () => import('./api').then((m) => m.AiChatRequestSchema),
  GenerateAiReportRequest: () => import('./api').then((m) => m.GenerateAiReportRequestSchema),

  // API 响应 Schema
  ApiResponse: <T>(schema: import('zod').ZodSchema<T>) =>
    import('./base').then((m) => m.ApiResponseSchema(schema)),
  PaginatedResponse: <T>(schema: import('zod').ZodSchema<T>) =>
    import('./base').then((m) => m.PaginatedResponseSchema(schema))
}

// 常用验证器
export const Validators = {
  // 邮箱验证
  email: (email: string) => {
    const emailSchema = z.string().email('请输入有效的邮箱地址')
    return emailSchema.safeParse(email)
  },

  // 手机号验证
  phone: (phone: string) => {
    const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    return phoneSchema.safeParse(phone)
  },

  // URL 验证
  url: (url: string) => {
    const urlSchema = z.string().url('请输入有效的URL')
    return urlSchema.safeParse(url)
  },

  // 日期验证
  date: (date: string) => {
    const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')
    return dateSchema.safeParse(date)
  },

  // 日期时间验证
  datetime: (datetime: string) => {
    const datetimeSchema = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, '日期时间格式应为 YYYY-MM-DD HH:mm:ss')
    return datetimeSchema.safeParse(datetime)
  }
}
