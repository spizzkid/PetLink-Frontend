# PetLink 后端开发文档

## 项目概述

PetLink 是一个宠物健康管理系统，包含桌面应用和云端服务。本文档为后端开发者提供详细的开发指南。

## 技术栈

- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT
- **文件处理**: Multer
- **文档处理**: 模拟实现（需要集成真实Word转PDF库）

## 项目结构

```
server/
├── src/
│   ├── routes/          # 路由定义
│   │   ├── auth.ts      # 认证路由
│   │   ├── clients.ts   # 客户管理路由
│   │   ├── pets.ts      # 宠物管理路由
│   │   ├── health-checks.ts # 健康检查路由
│   │   ├── ai-reports.ts # AI报告路由
│   │   └── sync.ts      # 数据同步路由
│   ├── middleware/      # 中间件
│   │   └── auth.ts      # JWT认证中间件
│   ├── services/        # 业务逻辑
│   │   └── documentService.ts # 文档处理服务
│   ├── lib/            # 工具库
│   │   └── prisma.ts   # Prisma客户端
│   └── types/          # TypeScript类型定义
├── prisma/             # 数据库模式
│   └── schema.prisma   # 数据库定义
└── uploads/           # 文件上传目录
```

## 环境配置

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 环境变量配置

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/petlink"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# 服务器配置
PORT=3001
NODE_ENV="development"

# 文件上传配置
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760  # 10MB

# 云存储配置（可选）
CLOUD_STORAGE_BUCKET="petlink-docs"
CLOUD_STORAGE_REGION="us-east-1"
```

### 3. 数据库初始化

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma db push

# （可选）查看数据库
npx prisma studio
```

## 核心功能开发

### 1. 认证系统

#### JWT认证中间件

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: '访问被拒绝，未提供令牌' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: '无效的令牌' })
  }
}
```

#### 认证路由

```typescript
// src/routes/auth.ts
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const router = Router()

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: '用户已存在' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // 生成JWT令牌
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN
    })

    res.json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    res.status(500).json({ error: '注册失败' })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(400).json({ error: '用户不存在' })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: '密码错误' })
    }

    // 生成JWT令牌
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN
    })

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    res.status(500).json({ error: '登录失败' })
  }
})

export { router as authRoutes }
```

### 2. 数据库模式设计

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联数据
  clients   Client[]
  pets      Pet[]
  healthChecks HealthCheck[]
  aiReports AiReport[]

  @@map("users")
}

model Client {
  id        String   @id @default(cuid())
  userId    String
  name      String
  phone     String
  wechat    String?
  address   String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关联
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pets      Pet[]

  @@map("clients")
}

model Pet {
  id          String   @id @default(cuid())
  userId      String
  clientId    String
  name        String
  type        String
  breed       String
  age         Int
  weight      Float
  gender      String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  client      Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  healthChecks HealthCheck[]

  @@map("pets")
}

model HealthCheck {
  id               String   @id @default(cuid())
  userId           String
  petId            String
  checkDate        DateTime
  checkType        String
  veterinarian     String
  weight           Float
  temperature      Float
  heartRate        Int
  symptoms         String   // JSON字符串
  diagnosis        String
  treatment        String
  notes            String?
  followUpDate     DateTime?
  status           String   @default("completed")
  reportUrl        String?
  reportPath       String?
  reportFilename   String?
  reportUploadedAt DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // 关联
  user             User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  pet              Pet           @relation(fields: [petId], references: [id], onDelete: Cascade)
  prescriptions    Prescription[]
  aiReports        AiReport[]

  @@map("health_checks")
}

model Prescription {
  id           String @id @default(cuid())
  healthCheckId String
  medication   String
  dosage       String
  frequency    String
  duration     String
  instructions String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关联
  healthCheck  HealthCheck @relation(fields: [healthCheckId], references: [id], onDelete: Cascade)

  @@map("prescriptions")
}

model AiReport {
  id             String   @id @default(cuid())
  userId         String
  petId          String
  healthCheckId  String?
  title          String
  status         String   @default("pending")
  fileUrl        String?
  pdfUrl         String?
  fileName       String?
  confidence     Float?
  highlights     String   // JSON字符串
  concerns       String   // JSON字符串
  recommendations String   // JSON字符串
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // 关联
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  pet            Pet          @relation(fields: [petId], references: [id], onDelete: Cascade)
  healthCheck    HealthCheck? @relation(fields: [healthCheckId], references: [id], onDelete: SetNull)

  @@map("ai_reports")
}
```

### 3. AI报告处理

#### 文档处理服务

```typescript
// src/services/documentService.ts
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface DocumentProcessResult {
  success: boolean
  fileUrl?: string
  pdfUrl?: string
  error?: string
}

export class DocumentService {
  private uploadDir: string

  constructor(uploadDir: string = './uploads') {
    this.uploadDir = uploadDir
    this.ensureUploadDir()
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  // 处理Word文档上传
  async processWordDocument(file: Express.Multer.File): Promise<DocumentProcessResult> {
    try {
      const fileId = uuidv4()
      const fileExtension = path.extname(file.originalname)
      const fileName = `${fileId}${fileExtension}`
      const filePath = path.join(this.uploadDir, fileName)

      // 保存原始文件
      await fs.writeFile(filePath, file.buffer)

      // 生成PDF（模拟实现）
      const pdfFileName = `${fileId}.pdf`
      const pdfFilePath = path.join(this.uploadDir, pdfFileName)

      // TODO: 集成真实的Word转PDF库
      // 例如: libreoffice --headless --convert-to pdf --outdir ./uploads ./uploads/fileName.docx
      await this.generatePdf(filePath, pdfFilePath)

      return {
        success: true,
        fileUrl: `/uploads/${fileName}`,
        pdfUrl: `/uploads/${pdfFileName}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文档处理失败'
      }
    }
  }

  // 模拟PDF生成（需要替换为真实实现）
  private async generatePdf(inputPath: string, outputPath: string): Promise<void> {
    // 这里应该集成真实的Word转PDF库
    // 例如使用: libreoffice, docx-pdf, puppeteer等

    // 模拟实现 - 创建一个简单的PDF文件
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(Generated PDF Report) Tj
/F1 12 Tf
100 650 Td
(This is a mock PDF generated from Word document) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000480 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
553
%%EOF`

    await fs.writeFile(outputPath, mockPdfContent)
  }

  // 删除文件
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileName = path.basename(fileUrl)
      const filePath = path.join(this.uploadDir, fileName)
      await fs.unlink(filePath)
    } catch (error) {
      console.error('删除文件失败:', error)
    }
  }
}
```

#### AI报告路由

```typescript
// src/routes/ai-reports.ts
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { DocumentService } from '../services/documentService'
import multer from 'multer'

const router = Router()
const documentService = new DocumentService()

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.doc', '.docx']
    const fileExtension = file.originalname.toLowerCase().match(/\.[0-9a-z]+$/)?.[0]

    if (allowedTypes.includes(fileExtension || '')) {
      cb(null, true)
    } else {
      cb(new Error('只支持Word文档格式 (.doc, .docx)'))
    }
  }
})

// 获取用户的AI报告列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId

    const reports = await prisma.aiReport.findMany({
      where: { userId },
      include: {
        pet: true,
        healthCheck: true
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ reports })
  } catch (error) {
    res.status(500).json({ error: '获取报告列表失败' })
  }
})

// 上传Word文档并生成AI报告
router.post('/analyze', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user.userId
    const { petId, title } = req.body

    if (!req.file) {
      return res.status(400).json({ error: '请上传Word文档' })
    }

    // 处理文档
    const processResult = await documentService.processWordDocument(req.file)

    if (!processResult.success) {
      return res.status(500).json({ error: processResult.error })
    }

    // 创建AI报告记录
    const report = await prisma.aiReport.create({
      data: {
        userId,
        petId,
        title,
        status: 'processing',
        fileUrl: processResult.fileUrl,
        pdfUrl: processResult.pdfUrl,
        fileName: req.file.originalname
      }
    })

    // 模拟AI分析（实际应该调用AI服务）
    setTimeout(async () => {
      await this.analyzeDocument(report.id)
    }, 5000)

    res.json({
      message: '文档上传成功，正在分析中...',
      report: {
        id: report.id,
        status: report.status,
        title: report.title
      }
    })
  } catch (error) {
    res.status(500).json({ error: '文档处理失败' })
  }
})

// 模拟AI分析（需要替换为真实AI服务）
async function analyzeDocument(reportId: string) {
  try {
    // 模拟AI分析结果
    const mockAnalysis = {
      confidence: 0.85,
      highlights: ['宠物整体健康状况良好', '疫苗接种记录完整', '体重在正常范围内'],
      concerns: ['轻微牙垢堆积', '建议增加运动量'],
      recommendations: [
        '定期刷牙，保持口腔卫生',
        '每天增加30分钟运动时间',
        '6个月后复查体重',
        '保持现有饮食习惯'
      ]
    }

    await prisma.aiReport.update({
      where: { id: reportId },
      data: {
        status: 'completed',
        confidence: mockAnalysis.confidence,
        highlights: JSON.stringify(mockAnalysis.highlights),
        concerns: JSON.stringify(mockAnalysis.concerns),
        recommendations: JSON.stringify(mockAnalysis.recommendations)
      }
    })
  } catch (error) {
    await prisma.aiReport.update({
      where: { id: reportId },
      data: { status: 'failed' }
    })
  }
}

// 重新分析报告
router.post('/:id/reanalyze', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const reportId = req.params.id

    // 检查报告是否存在且属于当前用户
    const report = await prisma.aiReport.findFirst({
      where: { id: reportId, userId }
    })

    if (!report) {
      return res.status(404).json({ error: '报告不存在' })
    }

    // 更新状态为处理中
    await prisma.aiReport.update({
      where: { id: reportId },
      data: { status: 'processing' }
    })

    // 重新分析
    setTimeout(async () => {
      await analyzeDocument(reportId)
    }, 5000)

    res.json({ message: '重新分析请求已提交' })
  } catch (error) {
    res.status(500).json({ error: '重新分析失败' })
  }
})

export { router as aiReportRoutes }
```

### 4. 数据同步功能

#### 同步路由

```typescript
// src/routes/sync.ts
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// 上传本地数据到云端
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId
    const syncData = req.body

    if (!syncData || !syncData.clients) {
      return res.status(400).json({ error: '无效的同步数据' })
    }

    // 同步客户数据
    const syncedClients = await syncClients(userId, syncData.clients)

    // 同步宠物数据
    const syncedPets = await syncPets(userId, syncData.pets, syncData.clients)

    // 同步健康检查数据
    const syncedHealthChecks = await syncHealthChecks(userId, syncData.healthChecks, syncData.pets)

    // 同步处方数据
    const syncedPrescriptions = await syncPrescriptions(
      userId,
      syncData.prescriptions,
      syncData.healthChecks
    )

    res.json({
      message: '数据同步成功',
      syncedClients,
      syncedPets,
      syncedHealthChecks,
      syncedPrescriptions
    })
  } catch (error) {
    console.error('Data sync error:', error)
    res.status(500).json({ error: '数据同步失败' })
  }
})

// 获取同步状态
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId

    const [clientCount, petCount, healthCheckCount] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.pet.count({ where: { userId } }),
      prisma.healthCheck.count({ where: { userId } })
    ])

    res.json({
      clients: clientCount,
      pets: petCount,
      healthChecks: healthCheckCount,
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: '获取同步状态失败' })
  }
})

// 从云端下载数据
router.get('/download', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId

    const [clients, pets, healthChecks] = await Promise.all([
      prisma.client.findMany({ where: { userId } }),
      prisma.pet.findMany({
        where: { userId },
        include: { owner: true }
      }),
      prisma.healthCheck.findMany({
        where: { userId },
        include: { pet: true }
      })
    ])

    res.json({
      clients,
      pets,
      healthChecks
    })
  } catch (error) {
    res.status(500).json({ error: '下载数据失败' })
  }
})

// 辅助函数：同步客户数据
async function syncClients(userId: string, clients: any[]): Promise<number> {
  let syncedCount = 0

  for (const clientData of clients) {
    try {
      // 映射本地数据到云端格式
      const cloudClient = {
        id: clientData.id,
        userId,
        name: clientData.name,
        phone: clientData.phone,
        wechat: clientData.wechat,
        address: clientData.address,
        notes: clientData.notes
      }

      await prisma.client.upsert({
        where: { id: cloudClient.id },
        update: cloudClient,
        create: cloudClient
      })
      syncedCount++
    } catch (error) {
      console.error('Sync client error:', error)
    }
  }

  return syncedCount
}

// 辅助函数：同步宠物数据
async function syncPets(userId: string, pets: any[], clients: any[]): Promise<number> {
  let syncedCount = 0

  // 创建客户ID映射
  const clientMap = new Map(clients.map((c) => [c.id, c.id]))

  for (const petData of pets) {
    try {
      // 映射本地数据到云端格式
      const cloudPet = {
        id: petData.id,
        userId,
        clientId: petData.owner_id,
        name: petData.name,
        type: petData.type,
        breed: petData.breed,
        age: petData.age,
        weight: petData.weight,
        gender: petData.gender,
        description: petData.description
      }

      await prisma.pet.upsert({
        where: { id: cloudPet.id },
        update: cloudPet,
        create: cloudPet
      })
      syncedCount++
    } catch (error) {
      console.error('Sync pet error:', error)
    }
  }

  return syncedCount
}

// 辅助函数：同步健康检查数据
async function syncHealthChecks(userId: string, healthChecks: any[], pets: any[]): Promise<number> {
  let syncedCount = 0

  // 创建宠物ID映射
  const petMap = new Map(pets.map((p) => [p.id, p.id]))

  for (const healthCheckData of healthChecks) {
    try {
      // 映射本地数据到云端格式
      const cloudHealthCheck = {
        id: healthCheckData.id,
        userId,
        petId: healthCheckData.pet_id,
        checkDate: new Date(healthCheckData.check_date),
        checkType: healthCheckData.check_type,
        veterinarian: healthCheckData.veterinarian,
        weight: healthCheckData.weight,
        temperature: healthCheckData.temperature,
        heartRate: healthCheckData.heart_rate,
        symptoms: healthCheckData.symptoms,
        diagnosis: healthCheckData.diagnosis,
        treatment: healthCheckData.treatment,
        notes: healthCheckData.notes,
        followUpDate: healthCheckData.follow_up_date
          ? new Date(healthCheckData.follow_up_date)
          : null,
        status: healthCheckData.status,
        reportUrl: healthCheckData.report_url,
        reportPath: healthCheckData.report_path,
        reportFilename: healthCheckData.report_filename,
        reportUploadedAt: healthCheckData.report_uploaded_at
          ? new Date(healthCheckData.report_uploaded_at)
          : null
      }

      await prisma.healthCheck.upsert({
        where: { id: cloudHealthCheck.id },
        update: cloudHealthCheck,
        create: cloudHealthCheck
      })
      syncedCount++
    } catch (error) {
      console.error('Sync health check error:', error)
    }
  }

  return syncedCount
}

// 辅助函数：同步处方数据
async function syncPrescriptions(
  userId: string,
  prescriptions: any[],
  healthChecks: any[]
): Promise<number> {
  let syncedCount = 0

  // 创建健康检查ID映射
  const healthCheckMap = new Map(healthChecks.map((h) => [h.id, h.id]))

  for (const prescriptionData of prescriptions) {
    try {
      // 映射本地数据到云端格式
      const cloudPrescription = {
        id: prescriptionData.id,
        healthCheckId: prescriptionData.health_check_id,
        medication: prescriptionData.medication,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: prescriptionData.duration,
        instructions: prescriptionData.instructions
      }

      await prisma.prescription.upsert({
        where: { id: cloudPrescription.id },
        update: cloudPrescription,
        create: cloudPrescription
      })
      syncedCount++
    } catch (error) {
      console.error('Sync prescription error:', error)
    }
  }

  return syncedCount
}

export { router as syncRoutes }
```

### 5. 主服务器文件

```typescript
// src/index.ts
import express from 'express'
import cors from 'cors'
import path from 'path'
import { authRoutes } from './routes/auth'
import { clientRoutes } from './routes/clients'
import { petRoutes } from './routes/pets'
import { healthCheckRoutes } from './routes/health-checks'
import { aiReportRoutes } from './routes/ai-reports'
import { syncRoutes } from './routes/sync'

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/clients', authMiddleware, clientRoutes)
app.use('/api/pets', authMiddleware, petRoutes)
app.use('/api/health-checks', authMiddleware, healthCheckRoutes)
app.use('/api/ai-reports', authMiddleware, aiReportRoutes)
app.use('/api/sync', authMiddleware, syncRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/health`)
})
```

## 部署指南

### 1. 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 使用nodemon自动重启
npm run dev:watch
```

### 2. 生产环境

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start

# 使用PM2管理进程
pm2 start ecosystem.config.js
```

### 3. Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/petlink
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=petlink
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

## API文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

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
- `POST /api/health-checks` - 创建健康检查
- `PUT /api/health-checks/:id` - 更新健康检查
- `DELETE /api/health-checks/:id` - 删除健康检查

### AI报告

- `GET /api/ai-reports` - 获取AI报告列表
- `POST /api/ai-reports/analyze` - 上传文档生成报告
- `POST /api/ai-reports/:id/reanalyze` - 重新分析报告

### 数据同步

- `POST /api/sync/upload` - 上传本地数据
- `GET /api/sync/status` - 获取同步状态
- `GET /api/sync/download` - 下载数据

## 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 集成测试
npm run test:integration
```

## 待办事项

1. **集成真实的Word转PDF库**
   - 推荐使用: `libreoffice-headless`, `docx-pdf`, `puppeteer`
2. **集成真实的AI服务**
   - 推荐使用: OpenAI GPT-4, Claude, 或本地LLM
3. **添加文件上传限制和安全检查**
   - 文件类型验证
   - 文件大小限制
   - 病毒扫描
4. **添加数据备份和恢复功能**
   - 定期数据库备份
   - 一键恢复功能
5. **添加日志和监控系统**
   - 请求日志
   - 错误监控
   - 性能监控

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License
