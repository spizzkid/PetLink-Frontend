# PetLink 宠物健康管理系统 - 云端部署指南

## 系统概述

PetLink 是一个现代化的宠物健康管理系统，支持云端数据存储、用户认证和AI健康分析功能。

## 技术栈

### 前端

- **框架**: Electron + React + TypeScript
- **UI库**: Ant Design
- **状态管理**: Zustand
- **构建工具**: Vite

### 后端

- **框架**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT + bcrypt
- **文件上传**: Multer
- **AI服务**: 可集成OpenAI、百度AI等

### 部署

- **容器化**: Docker + Docker Compose
- **数据库**: PostgreSQL 15
- **缓存**: Redis (可选)

## 快速开始

### 1. 环境准备

确保你的系统已安装：

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (可选，使用Docker时会自动安装)

### 2. 后端服务部署

```bash
# 进入服务器目录
cd server

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
nano .env
```

在 `.env` 文件中配置以下内容：

```env
# 数据库配置
DATABASE_URL="postgresql://petlink:petlink_password@localhost:5432/petlink"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 服务器配置
PORT=3001
NODE_ENV=production
FRONTEND_URL="http://localhost:5173"

# AI服务配置（可选）
OPENAI_API_KEY="your-openai-api-key"
```

### 3. 使用Docker部署（推荐）

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 数据库初始化

```bash
# 生成Prisma客户端
npm run db:generate

# 推送数据库结构
npm run db:push

# 或者使用迁移
npm run db:migrate
```

### 5. 启动后端服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 6. 前端应用

```bash
# 回到项目根目录
cd ..

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 功能特性

### 1. 用户认证系统

- 用户注册/登录
- JWT token认证
- 密码加密存储
- 用户权限管理

### 2. 客户管理

- 客户信息CRUD
- 客户搜索功能
- 联系方式管理

### 3. 宠物管理

- 宠物信息CRUD
- 宠物分类管理
- 健康记录关联

### 4. 健康检查

- 健康检查记录
- 兽医信息管理
- 处方管理
- 检查报告上传

### 5. AI健康分析

- 图像上传和分析
- AI健康评估
- 报告生成和管理
- 置信度显示

## API接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取用户信息
- `PUT /api/auth/profile` - 更新用户信息
- `PUT /api/auth/password` - 修改密码

### 客户管理

- `GET /api/clients` - 获取客户列表
- `POST /api/clients` - 创建客户
- `PUT /api/clients/:id` - 更新客户
- `DELETE /api/clients/:id` - 删除客户

### 宠物管理

- `GET /api/pets` - 获取宠物列表
- `POST /api/pets` - 创建宠物
- `PUT /api/pets/:id` - 更新宠物
- `DELETE /api/pets/:id` - 删除宠物

### 健康检查

- `GET /api/health-checks` - 获取健康检查记录
- `POST /api/health-checks` - 创建健康检查记录
- `PUT /api/health-checks/:id` - 更新健康检查记录
- `DELETE /api/health-checks/:id` - 删除健康检查记录

### AI报告

- `GET /api/ai-reports` - 获取AI报告列表
- `POST /api/ai-reports/analyze` - 上传图片进行分析
- `GET /api/ai-reports/:id` - 获取单个AI报告
- `POST /api/ai-reports/:id/reanalyze` - 重新分析

## 数据库结构

系统使用以下主要表结构：

- `users` - 用户表
- `clients` - 客户表
- `pets` - 宠物表
- `health_checks` - 健康检查表
- `ai_reports` - AI报告表
- `prescriptions` - 处方表

## 部署注意事项

### 1. 安全配置

- 更改默认的JWT密钥
- 配置强密码策略
- 启用HTTPS
- 配置防火墙规则

### 2. 数据库安全

- 使用强密码
- 定期备份数据
- 限制数据库访问权限

### 3. 文件上传

- 限制文件大小
- 验证文件类型
- 定期清理上传文件

### 4. 性能优化

- 配置数据库索引
- 使用Redis缓存
- 启用Gzip压缩
- 配置CDN

## 监控和维护

### 1. 日志监控

- 查看应用日志
- 监控错误率
- 跟踪API响应时间

### 2. 数据库监控

- 监控数据库连接
- 检查查询性能
- 定期维护索引

### 3. 系统监控

- CPU和内存使用率
- 磁盘空间
- 网络流量

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接字符串
   - 确认用户权限

2. **JWT认证失败**
   - 检查JWT密钥配置
   - 验证token格式
   - 确认token未过期

3. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认磁盘空间充足

4. **AI分析失败**
   - 检查AI服务配置
   - 验证API密钥
   - 确认网络连接

## 扩展功能

### 1. 短信通知

- 集成短信服务
- 健康提醒功能
- 预约确认

### 2. 邮件服务

- 发送健康报告
- 预约提醒
- 营销邮件

### 3. 移动端支持

- 响应式设计
- 移动应用开发
- 推送通知

### 4. 数据分析

- 统计报表
- 趋势分析
- 预测模型

## 技术支持

如有问题或需要技术支持，请：

1. 查看日志文件
2. 检查配置文件
3. 参考API文档
4. 联系开发团队

---

**版本**: 1.0.0  
**最后更新**: 2025-08-16  
**维护者**: PetLink开发团队
