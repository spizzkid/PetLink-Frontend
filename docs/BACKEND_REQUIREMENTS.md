# PetLink 后端开发需求文档

## 项目概述
PetLink 是一个宠物健康管理系统，需要开发 RESTful API 后端服务，支持客户、宠物、健康检查记录的 CRUD 操作和用户登录认证。

## 技术栈要求
- **后端框架**: Node.js + Express 或 Python + FastAPI 或 Java + Spring Boot
- **数据库**: PostgreSQL (主要) + Redis (缓存/会话)
- **认证**: JWT Token
- **部署**: Docker 容器化
- **API 文档**: Swagger/OpenAPI 3.0

## 数据模型

### 1. 用户表 (users)
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user', 'vet'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 客户表 (clients)
```sql
CREATE TABLE clients (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  wechat VARCHAR(100),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 宠物表 (pets)
```sql
CREATE TABLE pets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'dog', 'cat', etc.
  breed VARCHAR(100),
  age INTEGER,
  weight DECIMAL(5,2),
  gender VARCHAR(10), -- 'male', 'female'
  owner_id VARCHAR(50) REFERENCES clients(id),
  avatar TEXT, -- 头像 URL
  notes TEXT,
  health_tags JSON, -- 健康标签数组
  birth_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. 健康检查表 (health_checks)
```sql
CREATE TABLE health_checks (
  id VARCHAR(50) PRIMARY KEY,
  pet_id VARCHAR(50) REFERENCES pets(id),
  check_date TIMESTAMP NOT NULL,
  check_type VARCHAR(50), -- 'routine', 'vaccination', 'emergency'
  veterinarian VARCHAR(100),
  weight DECIMAL(5,2),
  temperature DECIMAL(4,2),
  heart_rate INTEGER,
  symptoms TEXT,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  follow_up_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 接口规范

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新 Token
- `GET /api/auth/profile` - 获取当前用户信息

### 客户管理
- `GET /api/clients` - 获取客户列表 (支持分页、搜索)
- `GET /api/clients/:id` - 获取单个客户
- `POST /api/clients` - 创建客户
- `PUT /api/clients/:id` - 更新客户
- `DELETE /api/clients/:id` - 删除客户
- `GET /api/clients/search?q=keyword` - 搜索客户

### 宠物管理
- `GET /api/pets` - 获取宠物列表
- `GET /api/pets/:id` - 获取单个宠物
- `GET /api/pets/owner/:ownerId` - 按主人获取宠物
- `POST /api/pets` - 创建宠物
- `PUT /api/pets/:id` - 更新宠物
- `DELETE /api/pets/:id` - 删除宠物
- `GET /api/pets/search?q=keyword` - 搜索宠物
- `POST /api/pets/:id/health-tags` - 添加健康标签
- `DELETE /api/pets/:id/health-tags` - 移除健康标签

### 健康检查
- `GET /api/health-checks` - 获取检查记录列表
- `GET /api/health-checks/:id` - 获取单个检查记录
- `GET /api/health-checks/pet/:petId` - 按宠物获取检查记录
- `POST /api/health-checks` - 创建检查记录
- `PUT /api/health-checks/:id` - 更新检查记录
- `DELETE /api/health-checks/:id` - 删除检查记录
- `GET /api/health-checks/trends/:petId` - 获取宠物健康趋势

### 统计信息
- `GET /api/stats/dashboard` - 获取仪表板统计数据

## 非功能需求

### 安全要求
- 所有 API 需要 JWT 认证 (除登录接口)
- 密码使用 bcrypt 加密
- 输入验证和 SQL 注入防护
- API 访问频率限制 (Rate Limiting)

### 性能要求
- API 响应时间 < 500ms
- 支持并发用户 100+
- 数据库查询优化 (索引)

### 部署要求
- Docker 容器化
- 环境变量配置
- 健康检查端点 `/health`
- 日志记录 (结构化日志)

## 交付物清单

### 代码交付
- [ ] 完整的后端 API 服务代码
- [ ] Docker 镜像和 docker-compose.yml
- [ ] 数据库迁移脚本
- [ ] 单元测试 (覆盖率 > 80%)
- [ ] API 集成测试

### 文档交付
- [ ] API 文档 (Swagger)
- [ ] 部署说明文档
- [ ] 数据库设计文档
- [ ] 开发环境搭建指南

### 配置文件
- [ ] 环境变量配置示例
- [ ] Nginx 配置 (如需要)
- [ ] CI/CD 配置 (GitHub Actions)

## 预算和时间估算

### 工作量评估
- **API 开发**: 15-20 工作日
- **数据库设计**: 3-5 工作日  
- **认证系统**: 5-7 工作日
- **测试编写**: 5-8 工作日
- **文档编写**: 3-5 工作日
- **部署配置**: 2-3 工作日

**总估算**: 30-45 工作日

### 里程碑
1. **Week 1-2**: 数据库设计 + 基础 CRUD API
2. **Week 3-4**: 认证系统 + 高级查询功能
3. **Week 5-6**: 测试 + 文档 + 部署配置

## 验收标准
- [ ] 所有 API 接口按照规范实现
- [ ] 单元测试通过率 > 95%
- [ ] API 文档完整且准确
- [ ] Docker 部署成功
- [ ] 性能测试达标
- [ ] 代码质量检查通过 (ESLint/类似工具)

## 沟通方式
- **项目管理**: GitHub Issues/Projects
- **代码审查**: GitHub Pull Request
- **即时沟通**: 微信/钉钉/Slack
- **周报**: 每周五发送进度报告

## 技术支持
开发完成后提供 **30 天技术支持**，包括：
- Bug 修复
- 部署协助
- 简单功能调整
