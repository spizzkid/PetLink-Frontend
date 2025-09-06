# PetLink 项目结构

## 📁 项目目录结构

```
petlink/
├── docs/                           # 项目文档
│   ├── DEPLOYMENT.md              # 云端部署指南
│   ├── database-design.md         # 数据库设计文档
│   ├── file-structure.md          # 文件结构说明（已废弃）
│   ├── improvements.md            # 改进建议文档
│   ├── project-instructions.md    # 项目开发指令
│   └── project-structure.md      # 项目结构说明（本文件）
├── scripts/                        # 部署脚本
│   ├── deploy.sh                   # Linux/Mac 部署脚本
│   ├── deploy.bat                  # Windows 部署脚本
│   ├── test-deployment.sh          # Linux/Mac 部署验证脚本
│   └── test-deployment.bat         # Windows 部署验证脚本
├── server/                         # 云端后端服务
│   ├── src/
│   │   ├── app.ts                  # Express应用主文件
│   │   ├── index.ts                # 服务器入口文件
│   │   ├── routes/                 # API路由
│   │   │   ├── auth.ts             # 认证相关路由
│   │   │   ├── clients.ts          # 客户管理路由
│   │   │   ├── pets.ts             # 宠物管理路由
│   │   │   ├── healthChecks.ts     # 健康检查路由
│   │   │   └── aiReports.ts        # AI报告路由
│   │   ├── middleware/             # 中间件
│   │   │   ├── auth.ts             # 认证中间件
│   │   │   ├── errorHandler.ts     # 错误处理中间件
│   │   │   ├── rateLimiter.ts      # 限流中间件
│   │   │   └── upload.ts           # 文件上传中间件
│   │   ├── lib/                    # 工具库
│   │   │   └── prisma.ts           # Prisma客户端
│   │   └── services/               # 业务服务
│   │       └── aiService.ts        # AI分析服务
│   ├── prisma/
│   │   └── schema.prisma           # 数据库模式定义
│   ├── uploads/                    # 文件上传目录
│   ├── package.json                # 后端依赖配置
│   ├── tsconfig.json               # TypeScript配置
│   ├── Dockerfile                  # Docker镜像配置
│   ├── docker-compose.yml          # Docker Compose配置
│   └── .env.example               # 环境变量示例
├── src/                           # 桌面应用源代码
│   ├── main/                      # 主进程
│   │   ├── database.ts            # 本地数据库（云端版本已弃用）
│   │   ├── index.ts               # 主进程入口
│   │   ├── services.ts            # 业务服务层
│   │   └── storage.ts             # 数据存储工具
│   ├── preload/                   # 预加载脚本
│   │   ├── index.d.ts             # 类型定义
│   │   └── index.ts               # 预加载脚本入口
│   ├── renderer/                  # 渲染进程
│   │   ├── index.html             # HTML模板
│   │   └── src/                   # 渲染进程源码
│   │       ├── App.tsx            # 应用根组件
│   │       ├── main.tsx           # 渲染进程入口
│   │       ├── components/        # React组件
│   │       │   ├── LoadingState.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   └── Versions.tsx
│   │       ├── pages/             # 页面组件
│   │       │   ├── Auth.tsx              # 登录页面（新增）
│   │       │   ├── AiChat.tsx
│   │       │   ├── AiReport.tsx          # AI报告（已更新）
│   │       │   ├── ArchiveManagementCenter.tsx
│   │       │   ├── CheckHistory.tsx
│   │       │   ├── ClientManagement.tsx
│   │       │   ├── Dashboard.tsx
│   │       │   ├── DataStatisticsCenter.tsx
│   │       │   ├── HealthCheck.tsx
│   │       │   ├── HealthCheckManagement.tsx
│   │       │   ├── HealthReportCenter.tsx
│   │       │   ├── Home.tsx
│   │       │   ├── PetManagement.tsx
│   │       │   └── Settings.tsx
│   │       ├── assets/            # 静态资源
│   │       ├── contexts/          # React Context（新增）
│   │       │   └── AuthContext.tsx    # 认证上下文
│   │       └── utils/             # 工具函数
│   └── shared/                    # 共享代码
│       ├── schemas/               # Zod验证模式
│       │   ├── api.ts            # API相关Schema
│       │   ├── base.ts           # 基础Schema
│       │   ├── entities.ts       # 实体Schema
│       │   └── index.ts          # 统一导出
│       ├── stores/                # Zustand状态管理
│       │   ├── clientStore.ts
│       │   ├── healthCheckStore.ts
│       │   ├── index.ts
│       │   ├── petStore.ts
│       │   └── uiStore.ts
│       ├── types/                 # TypeScript类型
│       │   └── index.ts
│       └── utils/                 # 工具函数
│           └── errorHandler.ts
├── out/                           # 构建输出
├── resources/                     # 应用资源
└── 配置文件...
```

## 🏗️ 架构说明

### 进程架构

- **Main Process** (`src/main/`) - 负责应用生命周期、数据库操作、系统API调用
- **Renderer Process** (`src/renderer/src/`) - 负责UI渲染和用户交互
- **Preload** (`src/preload/`) - 提供安全的API桥接
- **Shared** (`src/shared/`) - 多进程共享的代码和类型定义

### 状态管理

使用 **Zustand** 进行状态管理，主要store包括：

- `clientStore` - 客户管理状态
- `petStore` - 宠物管理状态
- `healthCheckStore` - 健康检查状态
- `uiStore` - UI状态管理

### 数据验证

使用 **Zod** 进行数据验证，包括：

- 实体验证模式 (`entities.ts`)
- API请求/响应模式 (`api.ts`)
- 基础类型定义 (`base.ts`)

### 路径别名

- `@renderer` → `src/renderer/src`
- `@shared` → `src/shared`

## 📋 功能模块

### 核心功能

1. **客户管理** - 添加、编辑、删除、搜索客户
2. **宠物管理** - 宠物档案管理
3. **健康检查** - 健康检测记录和管理
4. **AI报告** - AI分析报告生成
5. **数据统计** - 业务数据统计分析

### 页面结构

- `Home.tsx` - 首页
- `Dashboard.tsx` - 仪表板
- `ClientManagement.tsx` - 客户管理
- `PetManagement.tsx` - 宠物管理
- `HealthCheck.tsx` - 健康检测
- `HealthCheckManagement.tsx` - 健康检查管理
- `HealthReportCenter.tsx` - 健康报告中心
- `ArchiveManagementCenter.tsx` - 档案管理中心
- `DataStatisticsCenter.tsx` - 数据统计中心
- `AiChat.tsx` - AI助手
- `AiReport.tsx` - AI报告

## 🔧 开发规范

### 文件命名

- 组件文件使用大驼峰命名：`Sidebar.tsx`
- 页面文件使用大驼峰命名：`ClientManagement.tsx`
- 工具文件使用小驼峰命名：`errorHandler.ts`

### 导入规范

- 优先使用路径别名：`@shared/stores/clientStore`
- 相对路径用于同目录导入：`./components/Sidebar`
- 共享代码统一从`@shared`导入

### 组件组织

- 布局组件放在`components/`目录
- 页面组件放在`pages/`目录
- 可复用的UI组件考虑按功能分类

## 🚀 构建和部署

### 开发环境

```bash
yarn dev        # 启动开发服务器
```

### 生产构建

```bash
yarn build      # 构建生产版本
```

### 代码检查

```bash
yarn lint       # 代码质量检查
yarn typecheck  # TypeScript类型检查
```

## 📝 注意事项

1. **不要在** `src/renderer/` 根目录下创建组件文件
2. **所有渲染进程代码** 应该放在 `src/renderer/src/` 目录下
3. **共享代码** 放在 `src/shared/` 目录下
4. **文档文件** 统一放在 `docs/` 目录下
5. **使用路径别名** 而不是相对路径导入共享代码
