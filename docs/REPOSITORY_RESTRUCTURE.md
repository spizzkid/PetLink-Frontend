# PetLink 仓库重构计划

## 目标结构
```
petlink/
├── frontend/                    # 前端 Electron 应用
│   ├── src/
│   │   ├── main/               # Electron 主进程
│   │   ├── preload/            # 预加载脚本
│   │   ├── renderer/           # React 渲染进程
│   │   └── shared/             # 共享类型和工具
│   ├── build/                  # 构建资源
│   ├── resources/              # 应用资源
│   ├── package.json
│   ├── electron.vite.config.ts
│   ├── tsconfig.json
│   └── README.md               # 前端开发说明
├── backend/                     # 后端 API 服务
│   ├── src/
│   │   ├── controllers/        # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由定义
│   │   ├── middleware/        # 中间件
│   │   ├── utils/             # 工具函数
│   │   └── app.js             # 应用入口
│   ├── tests/                 # 测试文件
│   ├── migrations/            # 数据库迁移
│   ├── package.json
│   ├── Dockerfile
│   └── README.md              # 后端开发说明
├── docs/                       # 项目文档
│   ├── api/                   # API 文档
│   ├── deployment/            # 部署文档
│   └── requirements/          # 需求文档
├── docker-compose.yml         # 开发环境一键启动
├── docker-compose.prod.yml    # 生产环境配置
├── .github/
│   └── workflows/             # CI/CD 流程
├── .gitignore
├── README.md                  # 项目总览
└── package.json               # 根目录脚本
```

## 重构步骤

### 1. 备份当前代码
```bash
git checkout -b backup-original
git add .
git commit -m "backup: 重构前的原始代码"
git push origin backup-original
```

### 2. 创建新的目录结构
```bash
# 创建主要目录
mkdir frontend backend

# 移动前端代码
mv src frontend/
mv build frontend/
mv resources frontend/
mv electron.vite.config.ts frontend/
mv tsconfig*.json frontend/
mv eslint.config.mjs frontend/

# 创建后端目录结构
mkdir backend/src
mkdir backend/src/{controllers,models,routes,middleware,utils}
mkdir backend/tests
mkdir backend/migrations
```

### 3. 更新配置文件
- 调整前端的构建路径
- 创建后端的 package.json
- 更新 docker-compose.yml
- 调整 .gitignore

### 4. 创建根目录管理脚本
```json
{
  "name": "petlink",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install"
  }
}
```

## 外包协作优势

### 开发者体验
```bash
# 克隆仓库后
git clone https://github.com/your-username/petlink.git
cd petlink

# 一键安装所有依赖
npm run install:all

# 一键启动开发环境
npm run dev

# 或使用 Docker
docker-compose up -d
```

### 清晰的工作分工
- **前端目录** - 外包开发者主要不需要修改
- **后端目录** - 外包开发者的主要工作区域
- **docs目录** - 需求和API文档
- **根目录** - 项目配置和部署脚本

### 版本管理
- 前后端API变更在同一个commit
- 统一的版本号和发布流程
- 集成测试更容易配置

## 注意事项

### 保持前端独立性
```typescript
// frontend/src/config/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api'
```

### 后端独立部署
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3001
CMD ["npm", "start"]
```

### 文档同步
- API 变更时同时更新文档
- 前端类型定义和后端接口保持一致
- 部署文档包含前后端配置
```

这样组织后，外包开发者可以：
1. 看到完整的项目架构
2. 理解前端的具体需求
3. 在后端目录专注开发
4. 使用统一的开发和部署流程

需要我帮你执行这个重构吗？
