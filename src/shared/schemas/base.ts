import { z } from 'zod'

// 基础类型 Schema
export const IdSchema = z.string().uuid()
export const NameSchema = z.string().min(1).max(100)
export const PhoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
export const WechatSchema = z.string().optional()
export const AddressSchema = z.string().max(500).optional()
export const NotesSchema = z.string().max(1000).optional()
export const UrlSchema = z.string().url().optional()
export const FilePathSchema = z.string().optional()

// 日期类型 Schema
export const DateSchema = z.date()
export const DateTimeSchema = z.date()
export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD')

// 数字类型 Schema
export const PositiveNumberSchema = z.number().positive('必须大于0')
export const NonNegativeNumberSchema = z.number().nonnegative('不能小于0')
export const AgeSchema = z.number().int().min(0).max(30)
export const WeightSchema = z.number().positive('体重必须大于0')
export const TemperatureSchema = z.number().positive('体温必须大于0')
export const HeartRateSchema = z.number().int().positive('心率必须大于0')

// 枚举类型 Schema
export const PetTypeSchema = z.enum(['dog', 'cat', 'horse', 'other'])
export const GenderSchema = z.enum(['male', 'female'])
export const CheckTypeSchema = z.enum([
  'routine',
  'vaccination',
  'skin',
  'specialized',
  'emergency'
])
export const StatusSchema = z.enum(['completed', 'in_progress', 'scheduled', 'cancelled'])
export const ReportTypeSchema = z.enum(['analysis', 'recommendation', 'summary'])
export const ChatRoleSchema = z.enum(['user', 'assistant'])
export const NotificationTypeSchema = z.enum(['success', 'error', 'warning', 'info'])

// 数组类型 Schema
export const SymptomsSchema = z.array(z.string().max(200)).default([])
export const SuggestionsSchema = z.array(z.string().max(500)).default([])

// 分页参数 Schema
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  total: z.number().int().min(0).default(0)
})

// 搜索过滤参数 Schema
export const SearchFiltersSchema = z.object({
  query: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  dateRange: z
    .object({
      start: DateSchema,
      end: DateSchema
    })
    .optional()
})

// 基础响应 Schema
export const ApiResponseSchema = <T>(
  dataSchema: z.ZodType<T>
): z.ZodObject<{
  data: z.ZodType<T>
  message: z.ZodString
  success: z.ZodBoolean
  timestamp: z.ZodString
}> =>
  z.object({
    data: dataSchema,
    message: z.string(),
    success: z.boolean(),
    timestamp: z.string()
  })

// 表单数据 Schema
export const FormDataSchema = z.record(z.string(), z.unknown()).default({})

// 响应数据 Schema
export const ResponseDataSchema = z.record(z.string(), z.unknown()).default({})

// 日期范围 Schema
export const DateRangeSchema = z
  .object({
    start: DateSchema,
    end: DateSchema
  })
  .refine((data) => data.start <= data.end, {
    message: '开始日期不能晚于结束日期',
    path: ['start']
  })

// 分页响应 Schema
export const PaginatedResponseSchema = <T>(
  dataSchema: z.ZodType<T>
): z.ZodObject<{
  data: z.ZodArray<z.ZodType<T>>
  pagination: typeof PaginationParamsSchema
  message: z.ZodString
  success: z.ZodBoolean
  timestamp: z.ZodString
}> =>
  z.object({
    data: z.array(dataSchema),
    pagination: PaginationParamsSchema,
    message: z.string(),
    success: z.boolean(),
    timestamp: z.string()
  })
