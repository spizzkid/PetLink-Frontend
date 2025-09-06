# Petlink API 文档

## 概述

本文档描述 Petlink 系统的核心 API 功能，包含用户认证、权限管理、客户管理和宠物管理。系统支持多租户数据隔离和分级权限控制。

## 基础信息

- **基础URL**: `http://localhost:8000` 或 `https://api.chonglianlian.cn`
- **API版本**: `/api/v1`
- **认证方式**: Bearer Token (JWT)
- **权限模型**: 基于角色的访问控制 (RBAC)
  - `admin`: 系统管理员，可访问所有数据
  - `store`: 店铺用户，只能访问自己的数据

## 认证 API

### 用户登录

**获取访问令牌**

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=your_password
```

**响应示例**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 用户注册

**创建新用户**

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword",
  "name": "张三",
  "phone": "13800138000",
  "role": "store"  # 可选值: admin, store
}
```

**响应示例**

```json
{
  "id": "user-uuid",
  "username": "newuser",
  "email": "user@example.com",
  "name": "张三",
  "role": "store",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 管理员专用 API

> ⚠️ 注意：以下端点仅限 `admin` 角色用户访问

### 获取所有用户

**获取系统所有用户列表**

```http
GET /api/v1/admin/users?skip=0&limit=100
Authorization: Bearer {token}
```

**响应示例**

```json
[
  {
    "id": "user-uuid-1",
    "username": "admin",
    "email": "admin@example.com",
    "name": "管理员",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-10T08:00:00Z"
  },
  {
    "id": "user-uuid-2",
    "username": "store1",
    "email": "store1@example.com",
    "name": "店铺一",
    "role": "store",
    "is_active": true,
    "created_at": "2024-01-12T14:30:00Z"
  }
]
```

### 获取所有客户

**获取系统所有客户列表**

```http
GET /api/v1/admin/clients?skip=0&limit=100
Authorization: Bearer {token}
```

### 获取所有宠物

**获取系统所有宠物列表**

```http
GET /api/v1/admin/pets?skip=0&limit=100
Authorization: Bearer {token}
```

### 获取系统统计

**获取系统整体统计信息**

```http
GET /api/v1/admin/stats
Authorization: Bearer {token}
```

**响应示例**

```json
{
  "total_users": 15,
  "total_clients": 243,
  "total_pets": 567,
  "active_users": 12,
  "last_updated": "2024-01-15T16:45:00Z"
}
```

## 客户管理 API

> 📝 注意：以下端点为店铺用户(`store`)专用，数据自动按用户隔离

### 获取客户列表

**获取当前用户的所有客户（数据自动隔离）**

```http
GET /api/v1/clients?skip=0&limit=100
Authorization: Bearer {token}
```

### 创建客户

**创建新客户**

```http
POST /api/v1/clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "李客户",
  "phone": "13900139000",
  "wechat": "wechat_id",
  "address": "北京市朝阳区",
  "notes": "重要客户"
}
```

### 获取单个客户

**获取特定客户信息**

```http
GET /api/v1/clients/{client_id}
Authorization: Bearer {token}
```

### 更新客户

**更新客户信息**

```http
PUT /api/v1/clients/{client_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "更新后的姓名",
  "phone": "13900139999",
  "address": "更新后的地址"
}
```

### 删除客户

**删除客户**

```http
DELETE /api/v1/clients/{client_id}
Authorization: Bearer {token}
```

### 获取客户的宠物

**获取客户的所有宠物**

```http
GET /api/v1/clients/{client_id}/pets
Authorization: Bearer {token}
```

## 宠物管理 API

> 📝 注意：以下端点为店铺用户(`store`)专用，数据自动按用户隔离

### 获取宠物列表

**获取当前用户的所有宠物（数据自动隔离）**

```http
GET /api/v1/pets?skip=0&limit=100&client_id={client_id}
Authorization: Bearer {token}
```

### 创建宠物

**创建新宠物**

```http
POST /api/v1/pets
Authorization: Bearer {token}
Content-Type: application/json

{
  "client_id": "客户UUID",
  "name": "小白",
  "species": "dog",
  "breed": "金毛",
  "age": 2,
  "gender": "male",
  "color": "金色",
  "birth_date": "2022-01-15",
  "vaccination_status": "completed",
  "notes": "性格温顺"
}
```

### 获取单个宠物

**获取特定宠物信息**

```http
GET /api/v1/pets/{pet_id}
Authorization: Bearer {token}
```

### 更新宠物

**更新宠物信息**

```http
PUT /api/v1/pets/{pet_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "更新后的名字",
  "age": 3,
  "vaccination_status": "pending"
}
```

### 删除宠物

**删除宠物**

```http
DELETE /api/v1/pets/{pet_id}
Authorization: Bearer {token}
```

## 错误处理

### 统一错误格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "field": "phone",
      "message": "必须是有效的手机号格式"
    }
  }
}
```

### 错误码对照表

- `400` - 请求参数错误
- `401` - 认证失败（Token无效或过期）
- `403` - 权限不足（用户角色无法访问该资源）
- `404` - 资源不存在
- `422` - 数据验证失败
- `500` - 服务器内部错误

### 权限错误示例

```json
{
  "detail": "Insufficient permissions",
  "required_role": "admin",
  "current_role": "store"
}
```

## 认证要求

所有 API 端点（除认证端点外）都需要在请求头中包含有效的 JWT Token：

```
Authorization: Bearer {access_token}
```

## 速率限制

- 认证端点: 5次/分钟/IP
- 其他端点: 100次/分钟/用户

## 前端集成指南

### React + Electron 集成示例

#### 1. 认证工具函数

```javascript
// src/utils/auth.js
export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user'))
  return user?.role === 'admin'
}

export const getToken = () => {
  return localStorage.getItem('token')
}
```

#### 2. API服务封装

```javascript
// src/services/api.js
import axios from 'axios'
import { getToken } from './auth'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

// 自动添加认证token
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 管理员专用API
export const adminAPI = {
  getUsers: () => api.get('/api/v1/admin/users'),
  getStats: () => api.get('/api/v1/admin/stats')
}

// 店铺用户API
export const storeAPI = {
  getClients: () => api.get('/api/v1/clients'),
  getPets: () => api.get('/api/v1/pets')
}
```

#### 3. React路由守卫

```jsx
// src/components/ProtectedRoute.jsx
import { isAdmin } from '../utils/auth'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const user = JSON.parse(localStorage.getItem('user'))

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
```

#### 4. 条件渲染组件

```jsx
// React组件中使用
{
  isAdmin() && <button onClick={() => adminAPI.getUsers()}>查看所有用户</button>
}
```

### 权限处理流程

1. 用户登录获取JWT Token
2. 解析Token获取用户角色信息
3. 根据角色显示不同的功能菜单
4. 调用对应权限级别的API端点
5. 处理403权限错误，跳转无权限页面
