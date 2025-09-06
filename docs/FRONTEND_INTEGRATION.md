# 前端接口对接说明

## 当前前端架构
项目使用 Electron + React + TypeScript + Ant Design

## 需要对接的前端接口

### 1. API 客户端配置
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 JWT Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 2. 前端期望的 API 响应格式
```typescript
// 统一响应格式
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 分页响应格式
interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  error?: string
}
```

### 3. 前端现有的数据类型
```typescript
// src/shared/types.ts
export interface Client {
  id: string
  name: string
  phone: string
  wechat?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Pet {
  id: string
  name: string
  type: string
  breed?: string
  age?: number
  weight?: number
  gender?: string
  ownerId: string
  ownerName?: string // 前端展示用
  avatar?: string
  notes?: string
  healthTags: string[]
  birthDate?: string
  createdAt: string
  updatedAt: string
}

export interface HealthCheck {
  id: string
  petId: string
  petName?: string // 前端展示用
  petType?: string // 前端展示用
  ownerName?: string // 前端展示用
  checkDate: Date
  checkType: string
  veterinarian: string
  weight: number
  temperature: number
  heartRate: number
  symptoms: string
  diagnosis: string
  treatment: string
  notes?: string
  followUpDate?: Date
  status: string
  createdAt: string
  updatedAt: string
}
```

### 4. 前端现有的 API 调用点
需要后端实现对应的接口来替换这些调用：

```typescript
// 客户管理
window.api.getClients() → GET /api/clients
window.api.getClientById(id) → GET /api/clients/:id
window.api.createClient(data) → POST /api/clients
window.api.updateClient(id, data) → PUT /api/clients/:id
window.api.deleteClient(id) → DELETE /api/clients/:id
window.api.searchClients(query) → GET /api/clients/search?q=query

// 宠物管理
window.api.getPets() → GET /api/pets
window.api.getPetById(id) → GET /api/pets/:id
window.api.getPetsByOwner(ownerId) → GET /api/pets/owner/:ownerId
window.api.createPet(data) → POST /api/pets
window.api.updatePet(id, data) → PUT /api/pets/:id
window.api.deletePet(id) → DELETE /api/pets/:id
window.api.searchPets(query) → GET /api/pets/search?q=query

// 健康检查
window.api.getHealthChecks() → GET /api/health-checks
window.api.getHealthCheckById(id) → GET /api/health-checks/:id
window.api.getHealthChecksByPet(petId) → GET /api/health-checks/pet/:petId
window.api.createHealthCheck(data) → POST /api/health-checks
window.api.updateHealthCheck(id, data) → PUT /api/health-checks/:id
window.api.deleteHealthCheck(id) → DELETE /api/health-checks/:id

// 统计数据
window.api.getStats() → GET /api/stats/dashboard
```

## 认证流程
1. 用户在登录页面输入用户名/密码
2. 前端调用 `POST /api/auth/login`
3. 后端返回 JWT Token
4. 前端存储 Token 到 localStorage
5. 后续所有 API 请求都携带 Token

## 错误处理
前端期望的错误响应格式：
```typescript
{
  success: false,
  error: "具体错误信息",
  code?: "ERROR_CODE" // 可选的错误代码
}
```

## 部署对接
- 前端将打包为 Electron 桌面应用
- 需要配置后端 API 地址 (支持环境变量)
- 建议后端支持 CORS 跨域请求
