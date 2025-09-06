import { z } from 'zod'
import {
  ClientSchema,
  PetSchema,
  HealthCheckSchema,
  PrescriptionSchema,
  AiReportSchema,
  AiChatSchema,
  CreateClientSchema,
  CreatePetSchema,
  CreateHealthCheckSchema,
  CreatePrescriptionSchema,
  UpdateClientSchema,
  UpdatePetSchema,
  UpdateHealthCheckSchema,
  SearchResultSchema,
  StatsSchema
} from './entities'
import {
  PaginationParamsSchema,
  SearchFiltersSchema,
  ApiResponseSchema,
  PaginatedResponseSchema
} from './base'

// 客户相关 API Schema

// 获取客户列表请求
export const GetClientsRequestSchema = z.object({
  pagination: PaginationParamsSchema.optional(),
  filters: SearchFiltersSchema.optional()
})

// 获取客户列表响应
export const GetClientsResponseSchema = PaginatedResponseSchema(ClientSchema)

// 获取客户详情响应
export const GetClientResponseSchema = ApiResponseSchema(ClientSchema)

// 创建客户请求
export const CreateClientRequestSchema = z.object({
  data: CreateClientSchema
})

// 创建客户响应
export const CreateClientResponseSchema = ApiResponseSchema(ClientSchema)

// 更新客户请求
export const UpdateClientRequestSchema = z.object({
  id: z.string().uuid(),
  data: UpdateClientSchema
})

// 更新客户响应
export const UpdateClientResponseSchema = ApiResponseSchema(ClientSchema)

// 删除客户请求
export const DeleteClientRequestSchema = z.object({
  id: z.string().uuid()
})

// 删除客户响应
export const DeleteClientResponseSchema = ApiResponseSchema(z.boolean())

// 宠物相关 API Schema

// 获取宠物列表请求
export const GetPetsRequestSchema = z.object({
  pagination: PaginationParamsSchema.optional(),
  filters: SearchFiltersSchema.optional(),
  ownerId: z.string().uuid().optional()
})

// 获取宠物列表响应
export const GetPetsResponseSchema = PaginatedResponseSchema(PetSchema)

// 获取宠物详情响应
export const GetPetResponseSchema = ApiResponseSchema(PetSchema)

// 创建宠物请求
export const CreatePetRequestSchema = z.object({
  data: CreatePetSchema
})

// 创建宠物响应
export const CreatePetResponseSchema = ApiResponseSchema(PetSchema)

// 更新宠物请求
export const UpdatePetRequestSchema = z.object({
  id: z.string().uuid(),
  data: UpdatePetSchema
})

// 更新宠物响应
export const UpdatePetResponseSchema = ApiResponseSchema(PetSchema)

// 删除宠物请求
export const DeletePetRequestSchema = z.object({
  id: z.string().uuid()
})

// 删除宠物响应
export const DeletePetResponseSchema = ApiResponseSchema(z.boolean())

// 健康检查相关 API Schema

// 获取健康检查列表请求
export const GetHealthChecksRequestSchema = z.object({
  pagination: PaginationParamsSchema.optional(),
  filters: SearchFiltersSchema.optional(),
  petId: z.string().uuid().optional()
})

// 获取健康检查列表响应
export const GetHealthChecksResponseSchema = PaginatedResponseSchema(HealthCheckSchema)

// 获取健康检查详情响应
export const GetHealthCheckResponseSchema = ApiResponseSchema(HealthCheckSchema)

// 创建健康检查请求
export const CreateHealthCheckRequestSchema = z.object({
  data: CreateHealthCheckSchema
})

// 创建健康检查响应
export const CreateHealthCheckResponseSchema = ApiResponseSchema(HealthCheckSchema)

// 更新健康检查请求
export const UpdateHealthCheckRequestSchema = z.object({
  id: z.string().uuid(),
  data: UpdateHealthCheckSchema
})

// 更新健康检查响应
export const UpdateHealthCheckResponseSchema = ApiResponseSchema(HealthCheckSchema)

// 删除健康检查请求
export const DeleteHealthCheckRequestSchema = z.object({
  id: z.string().uuid()
})

// 删除健康检查响应
export const DeleteHealthCheckResponseSchema = ApiResponseSchema(z.boolean())

// 处方相关 API Schema

// 创建处方请求
export const CreatePrescriptionRequestSchema = z.object({
  healthCheckId: z.string().uuid(),
  data: CreatePrescriptionSchema
})

// 创建处方响应
export const CreatePrescriptionResponseSchema = ApiResponseSchema(PrescriptionSchema)

// AI 相关 API Schema

// 生成 AI 报告请求
export const GenerateAiReportRequestSchema = z.object({
  healthCheckId: z.string().uuid(),
  reportType: z.enum(['analysis', 'recommendation', 'summary'])
})

// 生成 AI 报告响应
export const GenerateAiReportResponseSchema = ApiResponseSchema(AiReportSchema)

// AI 聊天请求
export const AiChatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  context: z
    .object({
      petId: z.string().uuid().optional(),
      healthCheckId: z.string().uuid().optional(),
      reportId: z.string().uuid().optional()
    })
    .optional()
})

// AI 聊天响应
export const AiChatResponseSchema = ApiResponseSchema(
  z.object({
    message: z.string(),
    chatHistory: z.array(AiChatSchema)
  })
)

// 获取聊天历史请求
export const GetChatHistoryRequestSchema = z.object({
  sessionId: z.string().uuid(),
  pagination: PaginationParamsSchema.optional()
})

// 获取聊天历史响应
export const GetChatHistoryResponseSchema = PaginatedResponseSchema(AiChatSchema)

// 文件上传相关 API Schema

// 文件上传请求
export const FileUploadRequestSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['report', 'avatar', 'other']),
  relatedId: z.string().uuid().optional()
})

// 文件上传响应
export const FileUploadResponseSchema = ApiResponseSchema(
  z.object({
    url: z.string().url(),
    path: z.string(),
    filename: z.string(),
    size: z.number().int().min(0),
    mimetype: z.string()
  })
)

// 搜索相关 API Schema

// 全局搜索请求
export const GlobalSearchRequestSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['client', 'pet', 'health_check', 'all']).default('all'),
  pagination: PaginationParamsSchema.optional()
})

// 全局搜索响应
export const GlobalSearchResponseSchema = ApiResponseSchema(
  z.object({
    results: z.array(SearchResultSchema),
    total: z.number().int().min(0)
  })
)

// 统计相关 API Schema

// 获取统计数据请求
export const GetStatsRequestSchema = z.object({
  dateRange: z
    .object({
      start: z.date(),
      end: z.date()
    })
    .optional()
})

// 获取统计数据响应
export const GetStatsResponseSchema = ApiResponseSchema(StatsSchema)

// 批量操作 API Schema

// 批量删除请求
export const BulkDeleteRequestSchema = z.object({
  type: z.enum(['client', 'pet', 'health_check']),
  ids: z.array(z.string().uuid()).min(1).max(100)
})

// 批量删除响应
export const BulkDeleteResponseSchema = ApiResponseSchema(
  z.object({
    deletedCount: z.number().int().min(0),
    failedIds: z.array(z.string().uuid())
  })
)

// 导出相关 API Schema

// 导出数据请求
export const ExportDataRequestSchema = z.object({
  type: z.enum(['clients', 'pets', 'health_checks', 'all']),
  format: z.enum(['csv', 'xlsx', 'json']),
  filters: SearchFiltersSchema.optional()
})

// 导出数据响应
export const ExportDataResponseSchema = ApiResponseSchema(
  z.object({
    downloadUrl: z.string().url(),
    filename: z.string(),
    size: z.number().int().min(0)
  })
)

// 导入相关 API Schema

// 导入数据请求
export const ImportDataRequestSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['clients', 'pets', 'health_checks']),
  options: z
    .object({
      skipErrors: z.boolean().default(false),
      updateExisting: z.boolean().default(false)
    })
    .optional()
})

// 导入数据响应
export const ImportDataResponseSchema = ApiResponseSchema(
  z.object({
    importedCount: z.number().int().min(0),
    updatedCount: z.number().int().min(0),
    errorCount: z.number().int().min(0),
    errors: z.array(
      z.object({
        row: z.number().int().min(1),
        field: z.string(),
        message: z.string()
      })
    )
  })
)

// WebSocket 事件 Schema

// WebSocket 消息类型
export const WebSocketMessageSchema = z.object({
  type: z.enum(['notification', 'data_update', 'system_message']),
  payload: z.record(z.string(), z.unknown()).default({}),
  timestamp: z.string()
})

// 实时通知 Schema
export const RealtimeNotificationSchema = z.object({
  type: z.enum(['client_created', 'pet_created', 'health_check_created', 'report_generated']),
  message: z.string().max(500),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  timestamp: z.string()
})
