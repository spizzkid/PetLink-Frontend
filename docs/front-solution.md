# Petlink API 前端集成指南

## 🎯 核心特点

**API没有认证机制，直接访问！**

- ✅ 无需Token认证，直接调用API
- ✅ 无需处理认证错误和刷新
- ✅ 简化API调用流程
- ✅ 专注于业务逻辑，快速上线

## 🚀 快速开始

### 1. 用户登录

```javascript
// 简单的登录验证
async function login() {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'username=admin&password=admin123'
  });

  const data = await response.json();
  return data;
}
```

### 2. 直接调用API

```javascript
// 无需认证，直接调用
async function getClients() {
  const response = await fetch('/api/v1/clients/');
  return response.json();
}

async function createClient(clientData) {
  const response = await fetch('/api/v1/clients/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });
  return response.json();
}
```

## 📱 完整集成示例

### 使用 Axios（推荐）

```javascript
import axios from 'axios';

class PetlinkAPI {
  constructor() {
    this.baseURL = '/api/v1';
  }

  async login(username, password) {
    const response = await axios.post(`${this.baseURL}/auth/login`,
      `username=${username}&password=${password}`
    );
    return response.data;
  }

  async getClients() {
    const response = await axios.get(`${this.baseURL}/clients/`);
    return response.data;
  }

  async createClient(data) {
    const response = await axios.post(`${this.baseURL}/clients/`, data);
    return response.data;
  }

  async updateClient(clientId, data) {
    const response = await axios.put(`${this.baseURL}/clients/${clientId}`, data);
    return response.data;
  }

  async deleteClient(clientId) {
    const response = await axios.delete(`${this.baseURL}/clients/${clientId}`);
    return response.data;
  }

  async getClientPets(clientId) {
    const response = await axios.get(`${this.baseURL}/clients/${clientId}/pets`);
    return response.data;
  }
}

// 使用示例
const api = new PetlinkAPI();

// 登录
await api.login('admin', 'admin123');

// 调用API
const clients = await api.getClients();
const newClient = await api.createClient({
  name: '测试客户',
  phone: '13800138000'
});
```

### 使用 Fetch API

```javascript
class PetlinkAPI {
  constructor() {
    this.baseURL = '/api/v1';
  }

  async login(username, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `username=${username}&password=${password}`
    });

    const data = await response.json();
    return data;
  }

  async request(url, options = {}) {
    // 如果是POST/PUT，添加Content-Type
    const headers = {
      ...options.headers
    };

    if (options.method && ['POST', 'PUT'].includes(options.method)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response.json();
  }

  async getClients() {
    return this.request(`${this.baseURL}/clients/`);
  }

  async createClient(data) {
    return this.request(`${this.baseURL}/clients/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// 使用示例
const api = new PetlinkAPI();
await api.login('admin', 'admin123');
const clients = await api.getClients();
```

## ⚠️ 注意事项

### ✅ 现在不需要做的事情

```javascript
// ❌ 不需要处理Token认证
// const token = localStorage.getItem('token');
// headers: { 'Authorization': `Bearer ${token}` }

// ❌ 不需要处理401认证错误
// axios.interceptors.response.use(
//   response => response,
//   async error => {
//     if (error.response?.status === 401) {
//       // 不需要这个！已经移除认证
//     }
//     return Promise.reject(error);
//   }
// );

// ❌ 不需要Token刷新逻辑
// async function refreshToken() {
//   // 不需要这个！已经移除认证
// }
```

### ✅ 建议做的事情

```javascript
// ✅ 正常的错误处理（业务错误、网络错误）
try {
  const clients = await api.getClients();
} catch (error) {
  // 处理网络错误和业务错误
  console.error('API调用失败:', error);
}

// ✅ 简化的API调用
const response = await fetch('/api/v1/clients');
const data = await response.json();
```

## 📋 API端点列表

### 客户管理

```javascript
// 获取客户列表
GET /api/v1/clients/
Response: Client[]

// 创建客户
POST /api/v1/clients/
Body: { name: string, phone: string, wechat?: string, address?: string, notes?: string }
Response: Client

// 获取单个客户
GET /api/v1/clients/{client_id}
Response: Client

// 更新客户
PUT /api/v1/clients/{client_id}
Body: { name?: string, phone?: string, wechat?: string, address?: string, notes?: string }
Response: Client

// 删除客户
DELETE /api/v1/clients/{client_id}
Response: { message: string }

// 获取客户的宠物
GET /api/v1/clients/{client_id}/pets
Response: Pet[]
```

### 宠物管理

```javascript
// 获取宠物列表
GET /api/v1/pets/
Response: Pet[]

// 创建宠物
POST /api/v1/pets/
Body: {
  client_id: string,
  name: string,
  type: 'dog'|'cat'|'horse'|'bird'|'rabbit'|'other',
  breed: string,
  age: number,
  weight: number,
  gender: 'male'|'female',
  description?: string
}
Response: Pet
```

### 数据模型

```typescript
interface Client {
  id: string;
  name: string;
  phone: string;
  wechat?: string;
  address?: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Pet {
  id: string;
  client_id: string;
  name: string;
  type: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

## 🔧 测试用的Token

**当前可用的测试token：**
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTY5MDE3MzksInN1YiI6ImFkbWluLTAwMSIsInR5cGUiOiJhY2Nlc3MifQ.qOAlCOpFVdbZreyyC0jcW5hbeuox4tUyMbmaS_atoMk';
```

**登录信息：**
```javascript
const credentials = {
  username: 'admin',
  password: 'admin123'
};
```

## 🎯 总结

**前端只需要做2件事：**

1. **用户登录验证**
2. **直接调用API**

**就这么简单！**

- ✅ 无需Token管理
- ✅ 无需认证处理
- ✅ 用户体验流畅
- ✅ 专注业务逻辑，快速上线

**开始开发吧！**
