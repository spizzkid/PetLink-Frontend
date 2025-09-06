# Petlink 数据库设计文档

## 概述

本文档定义了 Petlink 宠物管理系统的完整数据库架构，采用 PostgreSQL 作为主要数据存储，以宠物档案为核心的数据管理设计原则。

## 设计原则

1. **宠物档案为核心**：所有业务数据围绕宠物档案构建
2. **用户权限隔离**：每个用户只能管理自己的数据
3. **AI健康报告集成**：支持AI分析报告和PDF文件管理
4. **多租户架构**：支持多用户独立使用
5. **类型安全**：通过 Prisma schema 确保数据完整性

## 数据库表结构

### 1. 用户表 (users)

系统用户表，用于用户认证和权限管理。

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

**字段说明：**

- `id`: 主键，使用 CUID
- `username`: 用户名，唯一且必填
- `email`: 邮箱，唯一且必填
- `password`: 密码哈希，必填
- `name`: 显示名称，必填
- `phone`: 联系电话，可选
- `role`: 用户角色（user/admin），默认user
- `is_active`: 是否激活，默认true
- `last_login_at`: 最后登录时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. 客户表 (clients)

宠物主人档案，与用户关联，每个用户可以管理多个客户。

```sql
CREATE TABLE clients (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    wechat VARCHAR(100),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_wechat ON clients(wechat);
CREATE INDEX idx_clients_created_at ON clients(created_at);
-- 用户级别的唯一约束
CREATE UNIQUE INDEX idx_clients_user_phone_unique ON clients(user_id, phone);
CREATE UNIQUE INDEX idx_clients_user_wechat_unique ON clients(user_id, wechat) WHERE wechat IS NOT NULL;
```

**字段说明：**

- `id`: 主键，使用 CUID
- `user_id`: 外键，关联用户表
- `name`: 主人姓名，必填
- `phone`: 联系电话，必填
- `wechat`: 微信号，可选
- `address`: 地址信息，可选
- `notes`: 备注信息，可选
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3. 宠物表 (pets)

**核心表**：存储宠物基本信息，是整个系统的核心实体。

```sql
CREATE TABLE pets (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('dog', 'cat', 'horse', 'bird', 'rabbit', 'other')),
    breed VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    avatar VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_pets_client_id ON pets(client_id);
CREATE INDEX idx_pets_name ON pets(name);
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_breed ON pets(breed);
CREATE INDEX idx_pets_gender ON pets(gender);
CREATE INDEX idx_pets_created_at ON pets(created_at);
-- 复合索引
CREATE INDEX idx_pets_type_breed ON pets(type, breed);
CREATE INDEX idx_pets_user_client ON pets(user_id, client_id);
CREATE INDEX idx_pets_client_name ON pets(client_id, name);
```

**字段说明：**

- `id`: 主键，使用 CUID
- `user_id`: 外键，关联用户表（权限隔离）
- `client_id`: 外键，关联主人表
- `name`: 宠物名称，必填
- `type`: 宠物类型，枚举值限制
- `breed`: 品种，必填
- `age`: 年龄，非负整数
- `weight`: 体重，精确到小数点后2位
- `gender`: 性别，枚举值限制
- `avatar`: 头像图片URL，可选
- `description`: 描述信息，可选
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 4. 健康检查表 (health_checks)

存储宠物健康检查记录，与宠物表关联。

```sql
CREATE TABLE health_checks (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    pet_id VARCHAR(255) NOT NULL,
    check_date TIMESTAMP NOT NULL,
    check_type VARCHAR(50) NOT NULL CHECK (check_type IN ('routine', 'vaccination', 'skin', 'specialized', 'emergency')),
    veterinarian VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
    temperature DECIMAL(3,1) NOT NULL CHECK (temperature > 0),
    heart_rate INTEGER NOT NULL CHECK (heart_rate > 0),
    symptoms TEXT, -- JSON 数组格式
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    notes TEXT,
    follow_up_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'scheduled', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_health_checks_user_id ON health_checks(user_id);
CREATE INDEX idx_health_checks_pet_id ON health_checks(pet_id);
CREATE INDEX idx_health_checks_check_date ON health_checks(check_date);
CREATE INDEX idx_health_checks_check_type ON health_checks(check_type);
CREATE INDEX idx_health_checks_veterinarian ON health_checks(veterinarian);
CREATE INDEX idx_health_checks_status ON health_checks(status);
CREATE INDEX idx_health_checks_follow_up_date ON health_checks(follow_up_date) WHERE follow_up_date IS NOT NULL;
-- 复合索引
CREATE INDEX idx_health_checks_pet_date ON health_checks(pet_id, check_date);
CREATE INDEX idx_health_checks_user_pet ON health_checks(user_id, pet_id);
CREATE INDEX idx_health_checks_type_date ON health_checks(check_type, check_date);
```

**字段说明：**

- `id`: 主键，使用 CUID
- `user_id`: 外键，关联用户表（权限隔离）
- `pet_id`: 外键，关联宠物表
- `check_date`: 检查日期，必填
- `check_type`: 检查类型，枚举值限制
- `veterinarian`: 兽医姓名，必填
- `weight`: 检查时体重，必填
- `temperature`: 体温，必填
- `heart_rate`: 心率，必填
- `symptoms`: 症状列表，JSON 数组格式存储
- `diagnosis`: 诊断结果，必填
- `treatment`: 治疗方案，必填
- `notes`: 备注，可选
- `follow_up_date`: 复诊日期，可选
- `status`: 状态，枚举值限制
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 5. 处方表 (prescriptions)

存储处方详细信息，与健康检查表关联。

```sql
CREATE TABLE prescriptions (
    id VARCHAR(255) PRIMARY KEY,
    health_check_id VARCHAR(255) NOT NULL,
    medication VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (health_check_id) REFERENCES health_checks(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_prescriptions_health_check_id ON prescriptions(health_check_id);
CREATE INDEX idx_prescriptions_medication ON prescriptions(medication);
CREATE INDEX idx_prescriptions_created_at ON prescriptions(created_at);
```

**字段说明：**

- `id`: 主键，使用 CUID
- `health_check_id`: 外键，关联健康检查表
- `medication`: 药品名称，必填
- `dosage`: 剂量，必填
- `frequency`: 使用频率，必填
- `duration`: 使用时长，必填
- `instructions`: 使用说明，必填
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 6. AI健康报告表 (ai_reports)

**核心功能表**：存储AI分析的健康报告和PDF文件信息。

```sql
CREATE TABLE ai_reports (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    pet_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    image_url VARCHAR(1000),
    file_url VARCHAR(1000),
    file_name VARCHAR(500),
    pdf_url VARCHAR(1000),
    pdf_path VARCHAR(1000),
    pdf_filename VARCHAR(500),
    pdf_uploaded_at TIMESTAMP,
    analysis_result JSONB,
    highlights TEXT[], -- 字符串数组
    concerns TEXT[], -- 字符串数组
    recommendations TEXT[], -- 字符串数组
    confidence DECIMAL(3,2),
    report_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_ai_reports_user_id ON ai_reports(user_id);
CREATE INDEX idx_ai_reports_pet_id ON ai_reports(pet_id);
CREATE INDEX idx_ai_reports_status ON ai_reports(status);
CREATE INDEX idx_ai_reports_created_at ON ai_reports(created_at);
CREATE INDEX idx_ai_reports_confidence ON ai_reports(confidence) WHERE confidence IS NOT NULL;
CREATE INDEX idx_ai_reports_pdf_url ON ai_reports(pdf_url) WHERE pdf_url IS NOT NULL;
CREATE INDEX idx_ai_reports_pdf_uploaded_at ON ai_reports(pdf_uploaded_at) WHERE pdf_uploaded_at IS NOT NULL;
-- 复合索引
CREATE INDEX idx_ai_reports_pet_status ON ai_reports(pet_id, status);
CREATE INDEX idx_ai_reports_user_pet ON ai_reports(user_id, pet_id);
CREATE INDEX idx_ai_reports_status_created ON ai_reports(status, created_at);
-- JSONB 索引
CREATE INDEX idx_ai_reports_analysis_result ON ai_reports USING GIN(analysis_result);
```

**字段说明：**

- `id`: 主键，使用 CUID
- `user_id`: 外键，关联用户表（权限隔离）
- `pet_id`: 外键，关联宠物表
- `title`: 报告标题，必填
- `status`: 处理状态，枚举值限制
- `image_url`: 原始图片URL，可选
- `file_url`: 原始文件URL，可选
- `file_name`: 原始文件名，可选
- `pdf_url`: PDF报告URL，可选
- `pdf_path`: PDF本地路径，可选
- `pdf_filename`: PDF文件名，可选
- `pdf_uploaded_at`: PDF上传时间，可选
- `analysis_result`: AI分析结果，JSONB格式
- `highlights`: 重点发现，字符串数组
- `concerns`: 健康隐患，字符串数组
- `recommendations`: 建议，字符串数组
- `confidence`: AI置信度，0-1之间
- `report_url`: 完整报告URL，可选
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 数据关系图

```
users (1) ←→ (N) clients (1) ←→ (N) pets
    ↓                    ↓           ↓
    ↓                    ↓        health_checks (1) ←→ (N) prescriptions
    ↓                    ↓           ↓
    ↓                    └──→ ai_reports
    └──→ 直接关联所有表（权限隔离）
```

### 核心关系说明

1. **宠物档案为核心**：所有业务数据围绕pets表构建
2. **权限隔离**：每个表都包含user_id，确保用户数据隔离
3. **主人档案依附**：clients表通过pets表与业务数据关联
4. **AI报告集成**：ai_reports表直接关联pets表，支持PDF文件管理

## 数据完整性约束

### 1. 外键约束

- 删除用户时，级联删除其所有相关数据
- 删除客户时，级联删除其所有宠物记录
- 删除宠物时，级联删除其所有健康检查记录和AI报告
- 删除健康检查记录时，级联删除其所有处方记录

### 2. 检查约束

- 宠物类型限制：`'dog', 'cat', 'horse', 'bird', 'rabbit', 'other'`
- 宠物性别限制：`'male', 'female'`
- 检查类型限制：`'routine', 'vaccination', 'skin', 'specialized', 'emergency'`
- 检查状态限制：`'completed', 'in_progress', 'scheduled', 'cancelled'`
- AI报告状态限制：`'pending', 'processing', 'completed', 'failed'`
- 数值字段范围验证（年龄、体重、体温、心率、置信度等）

### 3. 非空约束

- 所有核心业务字段设置为 NOT NULL
- 时间戳字段必填
- 关系字段必填（user_id, pet_id等）

### 4. 唯一约束

- 用户名全局唯一
- 邮箱全局唯一
- 客户手机号用户级别唯一：同一用户下手机号不能重复
- 客户微信号用户级别唯一：同一用户下微信号不能重复

### 5. 数据类型约束

- 使用VARCHAR代替TEXT，提高查询性能
- 数值字段使用DECIMAL确保精度
- 时间字段使用TIMESTAMP
- JSON字段使用JSONB类型支持索引查询

## 性能优化策略

### 1. 索引设计

- **权限隔离索引**：所有表都创建user_id索引
- **核心业务索引**：为pets表创建多维度索引
- **外键索引**：为所有外键关系创建索引
- **复合索引**：优化常用查询组合
- **JSONB索引**：为AI分析结果创建GIN索引
- **条件索引**：为可选字段创建WHERE条件索引

### 2. 查询优化

- **覆盖索引**：减少I/O操作
- **分页查询**：使用LIMIT和OFFSET优化大数据量
- **关联查询**：合理使用JOIN和预加载
- **权限过滤**：所有查询都包含user_id条件

### 3. 数据类型选择

- **主键**：使用VARCHAR(255)存储CUID
- **数值**：使用DECIMAL确保精度
- **时间**：使用TIMESTAMP
- **JSON**：使用JSONB支持索引查询
- **大文本**：使用TEXT类型存储长内容

### 4. 分区策略

- **按用户分区**：大型部署可考虑按user_id分区
- **按时间分区**：历史数据可按时间分区归档
- **读写分离**：查询频繁的表可考虑读写分离

## 数据初始化脚本

```sql
-- 创建表
CREATE TABLE IF NOT EXISTS users (...);
CREATE TABLE IF NOT EXISTS clients (...);
CREATE TABLE IF NOT EXISTS pets (...);
CREATE TABLE IF NOT EXISTS health_checks (...);
CREATE TABLE IF NOT EXISTS prescriptions (...);
CREATE TABLE IF NOT EXISTS ai_reports (...);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_pets_name ON pets(name);
-- ... 其他索引

-- 插入示例用户
INSERT INTO users (id, username, email, password, name, role, created_at, updated_at)
VALUES ('1', 'admin', 'admin@petlink.com', 'hashed_password', '管理员', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO users (id, username, email, password, name, role, created_at, updated_at)
VALUES ('2', 'vet1', 'vet1@petlink.com', 'hashed_password', '兽医小王', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入示例客户
INSERT INTO clients (id, user_id, name, phone, wechat, address, notes, created_at, updated_at)
VALUES ('1', '2', '张三', '13800138000', 'zhangsan_wechat', '北京市朝阳区', '老客户', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入示例宠物
INSERT INTO pets (id, user_id, client_id, name, type, breed, age, weight, gender, description, created_at, updated_at)
VALUES ('1', '2', '1', '旺财', 'dog', '柴犬', 3, 15.5, 'male', '活泼好动', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入示例健康检查
INSERT INTO health_checks (id, user_id, pet_id, check_date, check_type, veterinarian, weight, temperature, heart_rate, symptoms, diagnosis, treatment, status, created_at, updated_at)
VALUES ('1', '2', '1', CURRENT_TIMESTAMP, 'routine', '兽医小王', 15.5, 38.5, 80, '["精神不振"]', '轻微感冒', '开药治疗', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入示例处方
INSERT INTO prescriptions (id, health_check_id, medication, dosage, frequency, duration, instructions, created_at, updated_at)
VALUES ('1', '1', '感冒灵', '每次1片', '每日3次', '5天', '饭后服用，多喝水', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入示例AI报告
INSERT INTO ai_reports (id, user_id, pet_id, title, status, analysis_result, highlights, concerns, recommendations, confidence, created_at, updated_at)
VALUES ('1', '2', '1', '旺财健康分析报告', 'completed',
         '{"overall_health": "good", "risk_factors": ["low_activity"]}',
         ARRAY['整体健康状况良好'],
         ARRAY['运动量偏低'],
         ARRAY['增加日常运动', '定期检查'],
         0.85,
         CURRENT_TIMESTAMP,
         CURRENT_TIMESTAMP);
```

## 数据迁移策略

### 1. 版本控制

- 使用 Prisma Migration 管理数据库版本
- 每个版本包含升级和降级脚本
- 记录版本变更日志
- 支持开发、测试、生产环境不同版本

### 2. 备份策略

- **自动备份**：每日定时备份
- **重要操作前备份**：数据迁移、结构变更前
- **云存储备份**：重要数据备份到云存储
- **备份验证**：定期验证备份完整性

### 3. 数据验证

- **完整性检查**：迁移后验证数据完整性
- **外键关系检查**：确保所有关联关系正确
- **索引验证**：验证所有索引正常工作
- **性能测试**：验证查询性能符合预期

### 4. 迁移路径

- **SQLite → PostgreSQL**：支持从本地SQLite迁移到云端PostgreSQL
- **数据清洗**：迁移过程中进行数据清洗和格式化
- **权限重建**：重新建立用户权限关系
- **测试验证**：迁移后进行全面测试

## 安全考虑

### 1. 数据加密

- **密码加密**：使用 bcrypt 等强哈希算法
- **连接加密**：PostgreSQL 使用 SSL/TLS 加密
- **敏感字段**：考虑对特别敏感的字段进行加密
- **备份加密**：数据库备份文件进行加密存储

### 2. 访问控制

- **数据库用户权限**：最小权限原则
- **应用层权限**：基于 user_id 的数据隔离
- **网络访问控制**：限制数据库访问IP
- **审计日志**：记录重要数据操作

### 3. 输入验证

- **应用层验证**：所有数据写入前进行验证
- **数据库约束**：利用数据库约束确保数据完整性
- **参数化查询**：使用 Prisma ORM 防止 SQL 注入
- **输入清理**：防止 XSS 和其他攻击

### 4. 数据隐私

- **个人信息保护**：符合相关隐私法规
- **数据脱敏**：在必要场景下进行数据脱敏
- **访问日志**：记录数据访问情况
- **数据生命周期**：建立数据清理和归档机制

## 监控和维护

### 1. 性能监控

- **查询性能**：监控慢查询和执行时间
- **连接池**：监控数据库连接池状态
- **资源使用**：CPU、内存、磁盘使用情况
- **索引效率**：监控索引使用情况和命中率

### 2. 定期维护

- **VACUUM 操作**：PostgreSQL 定期清理
- **索引重建**：重建碎片化索引
- **统计信息更新**：更新表统计信息
- **日志清理**：定期清理过期日志

### 3. 日志记录

- **操作日志**：记录数据库操作日志
- **错误日志**：记录错误和异常
- **性能日志**：记录性能指标
- **安全日志**：记录安全相关事件

### 4. 告警机制

- **性能告警**：性能异常时发送告警
- **容量告警**：磁盘空间不足时告警
- **连接告警**：连接异常时告警
- **安全告警**：安全事件告警

## 扩展规划

### 1. 功能扩展

- **疫苗管理**：增加疫苗记录和提醒功能
- **预约管理**：增加预约系统和日程管理
- **费用管理**：增加收费记录和财务报表
- **库存管理**：增加药品和用品库存管理

### 2. 技术扩展

- **微服务架构**：大型部署可考虑微服务化
- **读写分离**：提升读取性能
- **分布式存储**：支持海量数据存储
- **AI能力增强**：集成更多AI分析功能

### 3. 数据扩展

- **多媒体支持**：支持图片、视频等多媒体数据
- **IoT集成**：集成智能设备数据
- **第三方集成**：支持与第三方系统对接
- **数据分析**：增加数据分析和报表功能

### 4. 性能扩展

- **水平扩展**：支持数据库集群
- **缓存层**：增加Redis等缓存层
- **CDN加速**：静态资源使用CDN
- **负载均衡**：支持负载均衡部署

---

_文档版本：2.0_
_创建时间：2025-08-11_
_最后更新：2025-08-17_

## 更新说明

### v2.0 更新内容 (2025-08-17)

1. **架构调整**：
   - 从单用户SQLite设计调整为多用户PostgreSQL设计
   - 增加用户认证和权限管理系统
   - 实现多租户数据隔离

2. **核心功能**：
   - 以宠物档案为核心重构数据关系
   - 增加AI健康报告表，支持PDF文件管理
   - 完善主人档案依附宠物档案的设计

3. **技术升级**：
   - 使用PostgreSQL替代SQLite
   - 采用CUID作为主键生成策略
   - 增加JSONB字段支持复杂数据结构

4. **性能优化**：
   - 优化索引设计，增加复合索引
   - 改进查询性能和权限过滤
   - 增加数据分区和读写分离策略

5. **安全增强**：
   - 完善数据加密和访问控制
   - 增加审计日志和监控机制
   - 强化数据隐私保护措施

### v1.0 原始版本 (2025-08-11)

- 基础SQLite数据库设计
- 简单的宠物管理功能
- 基本的健康检查记录
