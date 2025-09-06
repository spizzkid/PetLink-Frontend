# 当前遇到的具体问题清单

## 🚨 紧急问题列表

### 1. 网络连接问题
- [ ] CORS 跨域请求被阻止
- [ ] API 接口 404 Not Found
- [ ] 连接超时或网络错误
- [ ] SSL/HTTPS 证书问题

### 2. 认证问题
- [ ] JWT Token 格式错误
- [ ] Token 过期处理
- [ ] 登录接口响应格式不匹配
- [ ] 权限验证失败

### 3. 数据格式问题
- [ ] API 响应格式与前端期望不符
- [ ] 日期格式转换错误
- [ ] JSON 序列化/反序列化问题
- [ ] 数据类型不匹配 (string vs number)

### 4. 数据库问题
- [ ] 数据库连接失败
- [ ] SQL 查询错误
- [ ] 数据表结构不匹配
- [ ] 外键约束问题

### 5. 环境配置问题
- [ ] 环境变量配置错误
- [ ] 端口冲突
- [ ] Docker 容器启动失败
- [ ] 依赖包版本冲突

## 📋 问题诊断 Checklist

### 前端检查项
```bash
# 1. 检查前端 API 配置
cat src/services/api.ts

# 2. 检查网络请求日志
# 打开浏览器开发者工具 -> Network 标签

# 3. 检查控制台错误
# 打开浏览器开发者工具 -> Console 标签

# 4. 检查 Electron 主进程日志
# 查看终端输出
```

### 后端检查项
```bash
# 1. 检查服务器状态
curl http://localhost:3001/health

# 2. 检查 API 接口
curl -X GET http://localhost:3001/api/clients

# 3. 检查数据库连接
# 查看数据库连接日志

# 4. 检查服务器日志
tail -f logs/app.log
```

### 网络检查项
```bash
# 1. 检查端口占用
netstat -ano | findstr :3001

# 2. 检查防火墙设置
# Windows: 检查 Windows Defender 防火墙

# 3. 测试本地连接
telnet localhost 3001
```

## 🔧 常见错误和解决方案

### CORS 错误
```javascript
// 错误信息
Access to fetch at 'http://localhost:3001/api/clients' from origin 'http://localhost:5173' has been blocked by CORS policy

// 解决方案 (后端)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
```

### API 格式不匹配
```typescript
// 前端期望格式
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 确保后端返回相同格式
res.json({
  success: true,
  data: clients
})
```

### JWT Token 问题
```typescript
// 前端 Token 设置
localStorage.setItem('auth_token', token)

// 请求头设置
headers: {
  'Authorization': `Bearer ${token}`
}

// 后端验证
const token = req.headers.authorization?.split(' ')[1]
```

## 📞 求助信息模板

当联系外包开发者时，请提供以下信息：

### 1. 错误截图
- 浏览器开发者工具的 Network 和 Console 截图
- 后端服务器错误日志
- 数据库连接错误信息

### 2. 环境信息
```
操作系统: Windows 11
Node.js 版本: v18.x.x
数据库: PostgreSQL 14.x
前端端口: 5173 (Vite dev server)
后端端口: 3001 (预期)
```

### 3. 复现步骤
1. 启动前端应用
2. 点击 "客户管理" 页面
3. 尝试加载客户列表
4. 出现错误: [具体错误信息]

### 4. 已尝试的解决方案
- 检查了 CORS 配置
- 重启了数据库服务
- 清除了浏览器缓存
- ...

## 🎯 期望的快速响应

### 24小时内
- 问题初步诊断
- 临时解决方案 (如果可能)
- 详细解决计划

### 48小时内
- 主要问题修复
- 基本功能可用
- 详细问题报告

### 一周内
- 完整解决方案
- 生产环境部署
- 文档和测试完善
