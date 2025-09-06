# PostgreSQL 云服务器配置与部署（PetLink）

适用：上海腾讯云 VPS 同机部署 Postgres + petlink-server；兼容托管 RDS / 托管 Postgres（Neon/Supabase）。

## 目标

- 不暴露 5432 到公网；应用通过容器内网连库。
- 最小改动：仅改 `.env` 与 `docker-compose.yml` 环境变量。
- 提供首发部署、数据迁移、备份与排错指引。

## 架构选项（简）

1. 推荐：VPS 同机部署（Docker Compose）
2. 托管 RDS（最稳但贵）
3. 托管 Postgres（Neon/Supabase 免费档，注意延迟与连接池）

---

## 方案 A：VPS 同机部署（推荐）

1. docker-compose 关键片段（server/docker-compose.yml）

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # 不要暴露公网端口
    # ports:
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  petlink-server:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

volumes:
  postgres_data:
```

2. .env（与 compose 同目录，生产放 VPS）

```
POSTGRES_DB=petlink
POSTGRES_USER=petlink
POSTGRES_PASSWORD=请改为强密码
JWT_SECRET=请改为强随机串
FRONTEND_URL=http://localhost:5173
# 应用通过容器内网连接 DB（无需 SSL）
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable
```

3. 首次部署（VPS Linux）

```
# 进入 server 目录，确保已放置 .env
docker compose up -d --build
# 查看运行状态
docker compose ps
# 健康检查
curl http://127.0.0.1:3001/health
```

4. 迁移现有数据（本地 -> VPS 容器内 DB）

```
# 本地导出（根据你本地 DB 主机/账号调整）
pg_dump -h localhost -U petlink -d petlink -Fc -f petlink.dump
# 上传到 VPS 后执行：
docker cp petlink.dump postgres:/tmp/petlink.dump
# 容器内恢复（使用 .env 中的用户/库名）
docker exec -it postgres bash -lc "pg_restore -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c -1 /tmp/petlink.dump"
```

5. 应用侧 Prisma 迁移

```
# 确保 DB 已就绪
docker compose exec petlink-server npx prisma migrate deploy
docker compose exec petlink-server npx prisma generate
```

6. 最小安全基线

- 不映射 5432；仅容器内可达。
- 强密码与 JWT_SECRET；.env 不入库、日志不打印连接串。
- 防火墙/Security Group 仅放行 3001（或你的对外端口）与 SSH 来源 IP。

7. 备份（每日 03:00，宿主机 cron 示例）

```
0 3 * * * docker exec postgres pg_dump -U ${POSTGRES_USER} -d ${POSTGRES_DB} -Fc -f /var/lib/postgresql/data/petlink-$(date +\%F).dump
```

建议将 dump 同步到对象存储（OSS/COS/Backblaze）。

---

## 方案 B：托管 RDS（简）

- 连接串（务必 SSL）：

```
DATABASE_URL="postgresql://user:strong_password@db-host:5432/petlink?sslmode=require"
```

- `docker-compose.yml` 改为 `DATABASE_URL=${DATABASE_URL}`，其余同上。
- 初次建库迁移：`npx prisma migrate deploy`。

## 方案 C：托管 Postgres（Neon / Supabase）

- 必用连接池 + SSL，Prisma 需：`?sslmode=require&pgbouncer=true&connection_limit=1`

```
# Supabase（连接池一般 6543）
postgresql://USER:PASSWORD@HOST:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
# Neon（Pool 端点）
postgresql://USER:PASSWORD@POOL_HOST/DB?sslmode=require&pgbouncer=true&connection_limit=1
```

---

## 常见问题

- 端口占用：确保只在 `server/src/index.ts` 调用 `app.listen`。
- 连接失败：检查 `.env`、容器网络、`depends_on.condition` 与健康检查。
- 迁移失败：先恢复数据再 `migrate deploy`；或清理后重跑（谨慎）。
- 性能：并发上来后加 PgBouncer（或云厂商自带连接池）。

## 回滚/恢复

- 从最近一次 `pg_dump` 恢复：`pg_restore -U ... -d ... -c -1 file.dump`
- 重要操作前先做一次手动备份。

## 成本控制

- 初期用 VPS 同机部署，数据量/并发上来再切 RDS。
- 亦可用托管 Postgres 免费档验证市场，但注意延迟与波动。
