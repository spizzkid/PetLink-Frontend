# PetLink 后端 API 设计文档

## 概述

本文档详细描述了 PetLink 系统后端 API 的设计规范、接口定义和数据格式，用于前端开发者集成和测试。

## 基础信息

- **基础URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 认证 API

### 用户注册

- **URL**: `/auth/register`
- **方法**: POST
- **描述**: 用户注册

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

**响应**:

```json
{
  "success": true,
  "message": "注册成功",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "用户名"
  }
}
```

### 用户登录

- **URL**: `/auth/login`
- **方法**: POST
- **描述**: 用户登录

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:

```json
{
  "success": true,
  "message": "登录成功",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "用户名"
  }
}
```

## 客户管理 API

### 获取客户列表

- **URL**: `/clients`
- **方法**: GET
- **认证**: 需要认证
- **描述**: 获取当前用户的客户列表

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "client_id",
      "name": "客户姓名",
      "phone": "13800138000",
      "wechat": "wechat_id",
      "address": "客户地址",
      "notes": "备注信息",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建客户

- **URL**: `/clients`
- **方法**: POST
- **认证**: 需要认证
- **描述**: 创建新客户

**请求体**:

```json
{
  "name": "客户姓名",
  "phone": "13800138000",
  "wechat": "wechat_id",
  "address": "客户地址",
  "notes": "备注信息"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "id": "new_client_id",
    "name": "客户姓名",
    "phone": "13800138000",
    "wechat": "wechat_id",
    "address": "客户地址",
    "notes": "备注信息",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新客户

- **URL**: `/clients/:id`
- **方法**: PUT
- **认证**: 需要认证
- **描述**: 更新客户信息

**请求体**:

```json
{
  "name": "新客户姓名",
  "phone": "13800138001",
  "wechat": "new_wechat_id",
  "address": "新地址",
  "notes": "新备注"
}
```

### 删除客户

- **URL**: `/clients/:id`
- **方法**: DELETE
- **认证**: 需要认证
- **描述**: 删除客户

**响应**:

```json
{
  "success": true,
  "message": "客户删除成功"
}
```

## 宠物管理 API

### 获取宠物列表

- **URL**: `/pets`
- **方法**: GET
- **认证**: 需要认证
- **描述**: 获取当前用户的宠物列表

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "pet_id",
      "name": "宠物名称",
      "type": "dog",
      "breed": "金毛",
      "age": 3,
      "weight": 25.5,
      "gender": "male",
      "owner": {
        "id": "owner_id",
        "name": "主人姓名"
      },
      "description": "宠物描述",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建宠物

- **URL**: `/pets`
- **方法**: POST
- **认证**: 需要认证
- **描述**: 创建新宠物

**请求体**:

```json
{
  "name": "宠物名称",
  "type": "dog",
  "breed": "金毛",
  "age": 3,
  "weight": 25.5,
  "gender": "male",
  "ownerId": "owner_id",
  "description": "宠物描述"
}
```

### 更新宠物

- **URL**: `/pets/:id`
- **方法**: PUT
- **认证**: 需要认证
- **描述**: 更新宠物信息

**请求体**:

```json
{
  "name": "新宠物名称",
  "type": "dog",
  "breed": "新品种",
  "age": 4,
  "weight": 26.0,
  "gender": "male",
  "ownerId": "owner_id",
  "description": "新描述"
}
```

### 删除宠物

- **URL**: `/pets/:id`
- **方法**: DELETE
- **认证**: 需要认证
- **描述**: 删除宠物

## 健康检查 API

### 获取健康检查列表

- **URL**: `/health-checks`
- **方法**: GET
- **认证**: 需要认证
- **描述**: 获取健康检查记录列表

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "check_id",
      "petId": "pet_id",
      "checkDate": "2024-01-01T00:00:00.000Z",
      "checkType": "routine",
      "veterinarian": "兽医姓名",
      "weight": 25.5,
      "temperature": 38.5,
      "heartRate": 80,
      "symptoms": ["症状1", "症状2"],
      "diagnosis": "诊断结果",
      "treatment": "治疗方案",
      "notes": "备注",
      "followUpDate": "2024-01-15T00:00:00.000Z",
      "status": "completed",
      "reportUrl": "报告URL",
      "reportPath": "报告路径",
      "reportFilename": "报告文件名",
      "reportUploadedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "pet": {
        "id": "pet_id",
        "name": "宠物名称"
      }
    }
  ]
}
```

### 创建健康检查

- **URL**: `/health-checks`
- **方法**: POST
- **认证**: 需要认证
- **描述**: 创建健康检查记录

**请求体**:

```json
{
  "petId": "pet_id",
  "checkDate": "2024-01-01T00:00:00.000Z",
  "checkType": "routine",
  "veterinarian": "兽医姓名",
  "weight": 25.5,
  "temperature": 38.5,
  "heartRate": 80,
  "symptoms": ["症状1", "症状2"],
  "diagnosis": "诊断结果",
  "treatment": "治疗方案",
  "notes": "备注",
  "followUpDate": "2024-01-15T00:00:00.000Z",
  "status": "completed",
  "reportUrl": "报告URL",
  "reportPath": "报告路径",
  "reportFilename": "报告文件名"
}
```

### 更新健康检查

- **URL**: `/health-checks/:id`
- **方法**: PUT
- **认证**: 需要认证
- **描述**: 更新健康检查记录

### 删除健康检查

- **URL**: `/health-checks/:id`
- **方法**: DELETE
- **认证**: 需要认证
- **描述**: 删除健康检查记录

## AI 报告 API

### 获取 AI 报告列表

- **URL**: `/ai-reports`
- **方法**: GET
- **认证**: 需要认证
- **描述**: 获取 AI 报告列表

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "report_id",
      "title": "报告标题",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "highlights": ["亮点1", "亮点2"],
      "concerns": ["关注点1", "关注点2"],
      "recommendations": ["建议1", "建议2"],
      "confidence": 0.85,
      "pet": {
        "id": "pet_id",
        "name": "宠物名称",
        "type": "dog"
      },
      "fileUrl": "/uploads/file.docx",
      "pdfUrl": "/uploads/file.pdf",
      "fileName": "原始文件名.docx"
    }
  ]
}
```

### 上传文档生成 AI 报告

- **URL**: `/ai-reports/analyze`
- **方法**: POST
- **认证**: 需要认证
- **描述**: 上传 Word 文档并生成 AI 报告

**请求格式**: `multipart/form-data`

**请求参数**:

- `document`: Word 文档文件 (.doc, .docx)
- `petId`: 宠物ID
- `title`: 报告标题

**响应**:

```json
{
  "success": true,
  "message": "文档上传成功，正在分析中...",
  "report": {
    "id": "report_id",
    "status": "processing",
    "title": "报告标题"
  }
}
```

### 重新分析报告

- **URL**: `/ai-reports/:id/reanalyze`
- **方法**: POST
- **认证**: 需要认证
- **描述**: 重新分析指定报告

**响应**:

```json
{
  "success": true,
  "message": "重新分析请求已提交"
}
```

## 数据同步 API

### 上传本地数据

- **URL**: `/sync/upload`
- **方法**: POST
- **认证**: 需要认证
- **描述**: 将本地数据上传到云端

**请求体**:

```json
{
  "clients": [
    {
      "id": "client_id",
      "name": "客户姓名",
      "phone": "13800138000",
      "wechat": "wechat_id",
      "address": "客户地址",
      "notes": "备注信息",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pets": [
    {
      "id": "pet_id",
      "name": "宠物名称",
      "type": "dog",
      "breed": "金毛",
      "age": 3,
      "weight": 25.5,
      "gender": "male",
      "owner_id": "owner_id",
      "description": "宠物描述",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "healthChecks": [
    {
      "id": "check_id",
      "pet_id": "pet_id",
      "check_date": "2024-01-01T00:00:00.000Z",
      "check_type": "routine",
      "veterinarian": "兽医姓名",
      "weight": 25.5,
      "temperature": 38.5,
      "heart_rate": 80,
      "symptoms": "[]",
      "diagnosis": "诊断结果",
      "treatment": "治疗方案",
      "notes": "备注",
      "follow_up_date": "2024-01-15T00:00:00.000Z",
      "status": "completed",
      "report_url": "报告URL",
      "report_path": "报告路径",
      "report_filename": "报告文件名",
      "report_uploaded_at": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "prescriptions": [
    {
      "id": "prescription_id",
      "health_check_id": "check_id",
      "medication": "药品名称",
      "dosage": "剂量",
      "frequency": "频率",
      "duration": "疗程",
      "instructions": "用药说明",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**响应**:

```json
{
  "success": true,
  "message": "数据同步成功",
  "syncedClients": 10,
  "syncedPets": 15,
  "syncedHealthChecks": 20,
  "syncedPrescriptions": 25
}
```

### 获取同步状态

- **URL**: `/sync/status`
- **方法**: GET
- **认证**: 需要认证
- **描述**: 获取云端数据同步状态

**响应**:

```json
{
  "success": true,
  "data": {
    "clients": 10,
    "pets": 15,
    "healthChecks": 20,
    "lastSync": "2024-01-01T00:00:00.000Z"
  }
}
```

### 下载云端数据

- **URL**: `/sync/download`
- **方法**: GET
- **认证**: 需要认证
- **描述**: 从云端下载数据

**响应**:

```json
{
  "success": true,
  "data": {
    "clients": [...],
    "pets": [...],
    "healthChecks": [...]
  }
}
```

## 错误代码

| 代码 | 说明           |
| ---- | -------------- |
| 400  | 请求参数错误   |
| 401  | 认证失败       |
| 403  | 权限不足       |
| 404  | 资源不存在     |
| 500  | 服务器内部错误 |

## 数据类型定义

### 宠物类型

- `dog`: 狗
- `cat`: 猫
- `horse`: 马
- `other`: 其他

### 性别类型

- `male`: 雄性
- `female`: 雌性

### 健康检查类型

- `routine`: 常规检查
- `vaccination`: 疫苗接种
- `skin`: 皮肤检查
- `specialized`: 专科检查
- `emergency`: 急诊

### 健康检查状态

- `completed`: 已完成
- `in_progress`: 进行中
- `scheduled`: 已预约
- `cancelled`: 已取消

### AI 报告状态

- `pending`: 待处理
- `processing`: 处理中
- `completed`: 已完成
- `failed`: 失败

## 调用示例

### JavaScript/Fetch

```javascript
// 获取客户列表
async function getClients(token) {
  const response = await fetch('http://localhost:3001/api/clients', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  const result = await response.json()
  return result
}

// 创建客户
async function createClient(token, clientData) {
  const response = await fetch('http://localhost:3001/api/clients', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  })

  const result = await response.json()
  return result
}

// 上传文档生成AI报告
async function uploadDocument(token, file, petId, title) {
  const formData = new FormData()
  formData.append('document', file)
  formData.append('petId', petId)
  formData.append('title', title)

  const response = await fetch('http://localhost:3001/api/ai-reports/analyze', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  const result = await response.json()
  return result
}
```

### TypeScript

```typescript
interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class PetLinkAPI {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    return await response.json()
  }

  async getClients(): Promise<ApiResponse<Client[]>> {
    return this.request<Client[]>('/clients')
  }

  async createClient(
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Client>> {
    return this.request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    })
  }
}
```

## 测试建议

1. **认证测试**: 先测试注册和登录功能，获取有效的 JWT token
2. **数据 CRUD 测试**: 测试客户、宠物、健康检查的增删改查
3. **文件上传测试**: 测试 Word 文档上传和 AI 报告生成
4. **数据同步测试**: 测试本地数据与云端数据的同步功能
5. **错误处理测试**: 测试各种错误情况的响应

## 注意事项

1. 所有需要认证的 API 都必须在请求头中包含 `Authorization: Bearer <token>`
2. 文件上传接口使用 `multipart/form-data` 格式
3. 日期时间格式使用 ISO 8601 标准
4. 数组类型的字段在数据库中存储为 JSON 字符串
5. 删除操作会级联删除相关数据，请谨慎操作
