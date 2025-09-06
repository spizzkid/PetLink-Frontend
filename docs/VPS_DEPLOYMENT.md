# PetLink VPS 部署指南

## 系统要求

- Ubuntu 20.04/22.04 或 CentOS 7/8
- 至少 2GB RAM
- 至少 20GB 磁盘空间
- Node.js 18+ 和 PostgreSQL 15

## 部署步骤

### 1. 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git nginx

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建应用目录

```bash
sudo mkdir -p /opt/petlink
sudo chown -R $USER:$USER /opt/petlink
cd /opt/petlink
```

### 3. 上传应用文件

```bash
# 在本地机器上执行
scp -r server/ root@your-vps-ip:/opt/petlink/
scp scripts/setup-database.sh root@your-vps-ip:/opt/
scp scripts/database-init.sql root@your-vps-ip:/opt/
```

### 4. 初始化数据库

```bash
# 在VPS上执行
chmod +x /opt/setup-database.sh
/opt/setup-database.sh
```

### 5. 配置应用

```bash
cd /opt/petlink/server
npm install

# 创建生产环境配置
cat > .env << EOF
DATABASE_URL=postgresql://petlink_user:password@localhost:5432/petlink
JWT_SECRET=$(openssl rand -base64 32)
PORT=3001
NODE_ENV=production
UPLOAD_DIR=/opt/petlink/uploads
MAX_FILE_SIZE=10485760
EOF

# 创建上传目录
mkdir -p /opt/petlink/uploads
```

### 6. 构建应用

```bash
npm run build
```

### 7. 配置 PM2 进程管理

```bash
# 安装 PM2
sudo npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'petlink-server',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/petlink/error.log',
    out_file: '/var/log/petlink/out.log',
    log_file: '/var/log/petlink/combined.log',
    time: true
  }]
}
EOF

# 创建日志目录
sudo mkdir -p /var/log/petlink
sudo chown -R $USER:$USER /var/log/petlink

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/petlink << EOF
server {
    listen 80;
    server_name your-domain.com;

    # 文件上传大小限制
    client_max_body_size 10M;

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 静态文件服务
    location /uploads/ {
        alias /opt/petlink/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/petlink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. 配置防火墙

```bash
# 允许必要端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 10. 配置 SSL 证书（可选）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 11. 配置日志轮转

```bash
sudo tee /etc/logrotate.d/petlink << EOF
/var/log/petlink/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload petlink-server
    endscript
}
EOF
```

### 12. 监控和维护脚本

```bash
# 创建监控脚本
cat > /opt/petlink/monitor.sh << EOF
#!/bin/bash

# 检查应用状态
if ! pm2 status petlink-server | grep -q "online"; then
    echo "PetLink 服务离线，正在重启..." | logger -t petlink
    pm2 restart petlink-server
fi

# 检查磁盘空间
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 80 ]; then
    echo "磁盘空间不足: \${DISK_USAGE}%" | logger -t petlink
fi

# 检查内存使用
MEMORY_USAGE=\$(free | grep Mem | awk '{printf "%.0f", \$3/\$2 * 100}')
if [ \$MEMORY_USAGE -gt 80 ]; then
    echo "内存使用过高: \${MEMORY_USAGE}%" | logger -t petlink
fi
EOF

chmod +x /opt/petlink/monitor.sh

# 添加到 crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/petlink/monitor.sh") | crontab -
```

## 部署后验证

### 1. 检查服务状态

```bash
# 检查 PM2 状态
pm2 status

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 PostgreSQL 状态
sudo systemctl status postgresql
```

### 2. 测试 API 连接

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试通过域名访问
curl http://your-domain.com/health
```

### 3. 查看日志

```bash
# 查看 PM2 日志
pm2 logs petlink-server

# 查看系统日志
sudo journalctl -u nginx -f
```

## 维护命令

### 重启服务

```bash
# 重启应用
pm2 restart petlink-server

# 重启 Nginx
sudo systemctl restart nginx

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

### 更新应用

```bash
cd /opt/petlink/server
git pull origin main
npm install
npm run build
pm2 restart petlink-server
```

### 数据库备份

```bash
# 创建备份脚本
cat > /opt/petlink/backup.sh << EOF
#!/bin/bash

BACKUP_DIR="/opt/petlink/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# 备份数据库
sudo -u postgres pg_dump petlink > \$BACKUP_DIR/petlink_\$DATE.sql

# 压缩备份
gzip \$BACKUP_DIR/petlink_\$DATE.sql

# 删除7天前的备份
find \$BACKUP_DIR -name "*.gz" -mtime +7 -delete
EOF

chmod +x /opt/petlink/backup.sh

# 添加到 crontab（每天凌晨2点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/petlink/backup.sh") | crontab -
```

## 故障排除

### 常见问题

1. **应用无法启动**

   ```bash
   # 检查环境变量
   cat .env

   # 检查数据库连接
   sudo -u postgres psql -d petlink -c "SELECT 1;"

   # 查看详细错误
   pm2 logs petlink-server --lines 50
   ```

2. **数据库连接失败**

   ```bash
   # 检查 PostgreSQL 状态
   sudo systemctl status postgresql

   # 检查数据库用户权限
   sudo -u postgres psql -d petlink -c "\\du"
   ```

3. **Nginx 代理问题**

   ```bash
   # 检查 Nginx 配置
   sudo nginx -t

   # 查看 Nginx 错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

### 性能优化

1. **调整 PostgreSQL 配置**

   ```bash
   sudo vim /etc/postgresql/15/main/postgresql.conf
   # 修改以下参数
   # shared_buffers = 256MB
   # effective_cache_size = 1GB
   # maintenance_work_mem = 64MB
   # checkpoint_completion_target = 0.9
   # wal_buffers = 16MB
   # default_statistics_target = 100
   ```

2. **优化 Node.js 性能**
   ```bash
   # 增加 PM2 实例数
   pm2 scale petlink-server 4
   ```

这个部署指南涵盖了从服务器初始化到生产环境配置的完整流程，包括监控、备份和故障排除。
