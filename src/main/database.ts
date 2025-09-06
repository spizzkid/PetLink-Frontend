import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// 数据库接口定义
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

type PetRow = Omit<Pet, 'healthTags'> & { healthTags: string }

interface Pet {
  id: string
  name: string
  type: 'dog' | 'cat' | 'horse' | 'other'
  breed: string
  age: number
  weight: number
  gender: 'male' | 'female'
  ownerId: string
  avatar?: string
  notes?: string
  healthTags: string[] // 健康风险标签（JSON 数组存储）
  createdAt: string
  updatedAt: string
}

interface HealthCheck {
  id: string
  petId: string
  checkDate: string
  checkType: 'routine' | 'vaccination' | 'skin' | 'specialized' | 'emergency'
  veterinarian: string
  weight: number
  temperature: number
  heartRate: number
  symptoms: string
  diagnosis: string
  treatment: string
  notes?: string
  followUpDate?: string
  status: 'completed' | 'in_progress' | 'scheduled' | 'cancelled'
  createdAt: string
  updatedAt: string
}

class DatabaseService {
  private db: Database.Database
  private dbPath: string

  constructor() {
    // 数据库文件路径
    const userDataPath = app.getPath('userData')
    this.dbPath = path.join(userDataPath, 'petlink.db')

    // 确保目录存在
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true })

    // 初始化数据库
    this.db = new Database(this.dbPath)
    this.initTables()
    this.seedData()
  }

  private initTables(): void {
    // 创建客户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        wechat TEXT,
        address TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    // 创建宠物表（带 healthTags 列）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('dog', 'cat', 'horse', 'other')),
        breed TEXT NOT NULL,
        age INTEGER NOT NULL,
        weight REAL NOT NULL,
        gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
        ownerId TEXT NOT NULL,
        avatar TEXT,
        notes TEXT,
        healthTags TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES clients (id) ON DELETE CASCADE
      )
    `)

    // 迁移：如果旧库缺少 healthTags 列则补充
    try {
      const columns: Array<{ name: string }> = this.db
        .prepare('PRAGMA table_info(pets)')
        .all() as Array<{ name: string }>
      if (!columns.find((c) => c.name === 'healthTags')) {
        this.db.exec("ALTER TABLE pets ADD COLUMN healthTags TEXT NOT NULL DEFAULT '[]'")
        console.log('迁移: 为 pets 表添加 healthTags 列')
      }
    } catch (e) {
      console.warn('检查/迁移 healthTags 列失败', e)
    }

    // 创建健康检查表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id TEXT PRIMARY KEY,
        petId TEXT NOT NULL,
        checkDate TEXT NOT NULL,
        checkType TEXT NOT NULL CHECK (checkType IN ('routine', 'vaccination', 'skin', 'specialized', 'emergency')),
        veterinarian TEXT NOT NULL,
        weight REAL NOT NULL,
        temperature REAL NOT NULL,
        heartRate INTEGER NOT NULL,
        symptoms TEXT NOT NULL,
        diagnosis TEXT NOT NULL,
        treatment TEXT NOT NULL,
        notes TEXT,
        followUpDate TEXT,
        status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'scheduled', 'cancelled')),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (petId) REFERENCES pets (id) ON DELETE CASCADE
      )
    `)

    console.log('数据库表初始化完成')
  }

  private seedData(): void {
    // 检查是否已有数据
    const clientCount = this.db.prepare('SELECT COUNT(*) as count FROM clients').get() as {
      count: number
    }

    if (clientCount.count === 0) {
      console.log('初始化示例数据...')

      // 插入示例客户
      const insertClient = this.db.prepare(`
        INSERT INTO clients (id, name, phone, wechat, address, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const now = new Date().toISOString()

      insertClient.run(
        'client-1',
        '张三',
        '13800138001',
        'zhangsan_wx',
        '北京市朝阳区',
        '老客户',
        now,
        now
      )
      insertClient.run(
        'client-2',
        '李四',
        '13800138002',
        'lisi_wx',
        '上海市浦东新区',
        '新客户',
        now,
        now
      )
      insertClient.run('client-3', '王五', '13800138003', '', '广州市天河区', '', now, now)

      // 插入示例宠物
      const insertPet = this.db.prepare(`
        INSERT INTO pets (id, name, type, breed, age, weight, gender, ownerId, notes, healthTags, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      insertPet.run(
        'pet-1',
        '小白',
        'dog',
        '金毛',
        3,
        25.5,
        'male',
        'client-1',
        '很活泼',
        '[]',
        now,
        now
      )
      insertPet.run(
        'pet-2',
        '咪咪',
        'cat',
        '英短',
        2,
        4.2,
        'female',
        'client-2',
        '很安静',
        '[]',
        now,
        now
      )
      insertPet.run(
        'pet-3',
        '大黄',
        'dog',
        '柯基',
        1,
        8.5,
        'male',
        'client-3',
        '刚领养',
        '[]',
        now,
        now
      )

      console.log('示例数据初始化完成')
    }
  }

  // 客户相关操作
  getClients(): Client[] {
    return this.db.prepare('SELECT * FROM clients ORDER BY createdAt DESC').all() as Client[]
  }

  getClientById(id: string): Client | null {
    return (this.db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client) || null
  }

  createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const id = 'client-' + Date.now()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO clients (id, name, phone, wechat, address, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.name,
      data.phone,
      data.wechat || null,
      data.address || null,
      data.notes || null,
      now,
      now
    )

    return this.getClientById(id)!
  }

  updateClient(
    id: string,
    data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>
  ): Client | null {
    const now = new Date().toISOString()
    const fields: string[] = []
    const values: Array<string | number | null> = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?')
      values.push(data.phone)
    }
    if (data.wechat !== undefined) {
      fields.push('wechat = ?')
      values.push(data.wechat)
    }
    if (data.address !== undefined) {
      fields.push('address = ?')
      values.push(data.address)
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?')
      values.push(data.notes)
    }

    fields.push('updatedAt = ?')
    values.push(now, id)

    const stmt = this.db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`)
    const result = stmt.run(...values)

    return result.changes > 0 ? this.getClientById(id) : null
  }

  deleteClient(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }

  searchClients(query: string): Client[] {
    const stmt = this.db.prepare(`
      SELECT * FROM clients
      WHERE name LIKE ? OR phone LIKE ? OR wechat LIKE ? OR address LIKE ?
      ORDER BY createdAt DESC
    `)
    const searchTerm = `%${query}%`
    return stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as Client[]
  }

  // 宠物相关操作
  getPets(): Pet[] {
    const rows = this.db.prepare('SELECT * FROM pets ORDER BY createdAt DESC').all() as PetRow[]
    return rows.map((r) => this.mapPet(r)!)
  }

  private mapPet(row: PetRow): Pet | null {
    if (!row) {
      return null
    }
    let tags: string[] = []
    try {
      tags = row.healthTags ? JSON.parse(row.healthTags) : []
    } catch {
      tags = []
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { healthTags, ...rest } = row
    return { ...(rest as Omit<Pet, 'healthTags'>), healthTags: tags }
  }

  getPetById(id: string): Pet | null {
    const row = this.db.prepare('SELECT * FROM pets WHERE id = ?').get(id)
    return this.mapPet(row)
  }

  getPetsByOwner(ownerId: string): Pet[] {
    const rows = this.db
      .prepare('SELECT * FROM pets WHERE ownerId = ? ORDER BY createdAt DESC')
      .all(ownerId) as PetRow[]
    return rows.map((r) => this.mapPet(r)!)
  }

  createPet(data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>): Pet {
    const id = 'pet-' + Date.now()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO pets (id, name, type, breed, age, weight, gender, ownerId, avatar, notes, healthTags, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.name,
      data.type,
      data.breed,
      data.age,
      data.weight,
      data.gender,
      data.ownerId,
      data.avatar || null,
      data.notes || null,
      JSON.stringify(data.healthTags ?? []),
      now,
      now
    )

    return this.getPetById(id)!
  }

  updatePet(id: string, data: Partial<Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>>): Pet | null {
    const now = new Date().toISOString()
    const fields: string[] = []
    const values: Array<string | number | null> = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.type !== undefined) {
      fields.push('type = ?')
      values.push(data.type)
    }
    if (data.breed !== undefined) {
      fields.push('breed = ?')
      values.push(data.breed)
    }
    if (data.age !== undefined) {
      fields.push('age = ?')
      values.push(data.age)
    }
    if (data.weight !== undefined) {
      fields.push('weight = ?')
      values.push(data.weight)
    }
    if (data.gender !== undefined) {
      fields.push('gender = ?')
      values.push(data.gender)
    }
    if (data.ownerId !== undefined) {
      fields.push('ownerId = ?')
      values.push(data.ownerId)
    }
    if (data.avatar !== undefined) {
      fields.push('avatar = ?')
      values.push(data.avatar)
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?')
      values.push(data.notes)
    }
    if (data.healthTags !== undefined) {
      fields.push('healthTags = ?')
      values.push(JSON.stringify(data.healthTags || []))
    }

    fields.push('updatedAt = ?')
    values.push(now, id)

    const stmt = this.db.prepare(`UPDATE pets SET ${fields.join(', ')} WHERE id = ?`)
    const result = stmt.run(...values)

    return result.changes > 0 ? this.getPetById(id) : null
  }

  searchPets(query: string): Pet[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pets
      WHERE name LIKE ? OR type LIKE ? OR breed LIKE ? OR notes LIKE ?
      ORDER BY createdAt DESC
    `)
    const searchTerm = `%${query}%`
    const rows = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as PetRow[]
    return rows.map((r) => this.mapPet(r)!)
  }

  // Health tags operations
  findPetsByHealthTags(tags: string[], matchAll = false): Pet[] {
    return this.getPets().filter((p) => {
      if (!p.healthTags || p.healthTags.length === 0) return false
      return matchAll
        ? tags.every((t) => p.healthTags.includes(t))
        : tags.some((t) => p.healthTags.includes(t))
    })
  }

  addPetHealthTags(petId: string, tagsToAdd: string[]): Pet | null {
    const pet = this.getPetById(petId)
    if (!pet) return null

    const set = new Set([...(pet.healthTags || []), ...tagsToAdd])
    return this.updatePet(petId, { healthTags: Array.from(set) })
  }

  removePetHealthTags(petId: string, tagsToRemove: string[]): Pet | null {
    const pet = this.getPetById(petId)
    if (!pet) return null

    const toRemove = new Set(tagsToRemove)
    const next = (pet.healthTags || []).filter((t) => !toRemove.has(t))
    return this.updatePet(petId, { healthTags: next })
  }

  // 健康检查相关操作
  getHealthChecks(): HealthCheck[] {
    return this.db
      .prepare('SELECT * FROM health_checks ORDER BY checkDate DESC')
      .all() as HealthCheck[]
  }

  getHealthCheckById(id: string): HealthCheck | null {
    return (
      (this.db.prepare('SELECT * FROM health_checks WHERE id = ?').get(id) as HealthCheck) || null
    )
  }

  getHealthChecksByPet(petId: string): HealthCheck[] {
    return this.db
      .prepare('SELECT * FROM health_checks WHERE petId = ? ORDER BY checkDate DESC')
      .all(petId) as HealthCheck[]
  }

  createHealthCheck(data: Omit<HealthCheck, 'id' | 'createdAt' | 'updatedAt'>): HealthCheck {
    const id = 'health-' + Date.now()
    const now = new Date().toISOString()

    const stmt = this.db.prepare(`
      INSERT INTO health_checks (id, petId, checkDate, checkType, veterinarian, weight, temperature, heartRate, symptoms, diagnosis, treatment, notes, followUpDate, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      data.petId,
      data.checkDate,
      data.checkType,
      data.veterinarian,
      data.weight,
      data.temperature,
      data.heartRate,
      data.symptoms,
      data.diagnosis,
      data.treatment,
      data.notes || null,
      data.followUpDate || null,
      data.status,
      now,
      now
    )
    return this.getHealthCheckById(id)!
  }

  // 获取宠物的健康趋势数据
  getHealthTrends(petId: string): {
    healthChecks: HealthCheck[]
    weightTrend: { date: string; weight: number }[]
    temperatureTrend: { date: string; temperature: number }[]
    heartRateTrend: { date: string; heartRate: number }[]
  } {
    const healthChecks = this.getHealthChecksByPet(petId)

    // 从健康检查数据生成趋势
    const trendData = healthChecks.map((hc) => ({
      date: hc.checkDate,
      weight: hc.weight,
      temperature: hc.temperature,
      heartRate: hc.heartRate
    }))

    return {
      healthChecks,
      weightTrend: trendData.map((d) => ({ date: d.date, weight: d.weight })),
      temperatureTrend: trendData.map((d) => ({ date: d.date, temperature: d.temperature })),
      heartRateTrend: trendData.map((d) => ({ date: d.date, heartRate: d.heartRate }))
    }
  }

  // 统计信息
  getStats(): {
    totalClients: number
    totalPets: number
    totalHealthChecks: number
    totalAIReports: number
    healthChecksThisMonth: number
    newClientsThisMonth: number
    petTypeDistribution: Array<{ type: string; count: number }>
    checkTypeDistribution: Array<{ check_type: string; count: number }>
  } {
    const clientCount = this.db.prepare('SELECT COUNT(*) as count FROM clients').get() as {
      count: number
    }
    const petCount = this.db.prepare('SELECT COUNT(*) as count FROM pets').get() as {
      count: number
    }
    const healthCheckCount = this.db
      .prepare('SELECT COUNT(*) as count FROM health_checks')
      .get() as { count: number }
    // ai_health_reports 可能尚未实现，容错
    let aiReportCount = { count: 0 }
    try {
      aiReportCount = this.db.prepare('SELECT COUNT(*) as count FROM ai_health_reports').get() as {
        count: number
      }
    } catch {
      // ignore error
    }

    const petTypeDistribution = this.db
      .prepare(
        `
      SELECT type, COUNT(*) as count FROM pets GROUP BY type
    `
      )
      .all() as Array<{ type: string; count: number }>

    const checkTypeDistribution = this.db
      .prepare(
        `
      SELECT checkType as check_type, COUNT(*) as count FROM health_checks GROUP BY checkType
    `
      )
      .all() as Array<{ check_type: string; count: number }>

    return {
      totalClients: clientCount.count,
      totalPets: petCount.count,
      totalHealthChecks: healthCheckCount.count,
      totalAIReports: aiReportCount.count,
      healthChecksThisMonth: 0, // 可以根据需要实现
      newClientsThisMonth: 0, // 可以根据需要实现
      petTypeDistribution,
      checkTypeDistribution
    }
  }

  // 关闭数据库连接
  close(): void {
    this.db.close()
  }
}

// 导出单例实例
export const databaseService = new DatabaseService()
export default databaseService
