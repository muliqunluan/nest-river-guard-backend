# 生产环境部署指南 — River Guard

## 部署方案对比

| 方案 | 复杂度 | 可维护性 | 伸缩性 | 适用场景 |
|------|--------|---------|--------|---------|
| **Docker Compose** ⭐ | 低 | 高 | 中 | 中小型项目、单机部署 |
| **PM2 + Systemd** | 中 | 中 | 低 | 传统 Node 项目 |
| **Docker Swarm** | 中 | 高 | 高 | 多节点集群 |
| **Kubernetes** | 高 | 高 | 最高 | 大规模微服务 |

对于本项目，推荐 **Docker Compose + Nginx 反向代理**，这是最正规也最实用的方案。

---

# 方案一：Docker Compose（推荐）

## 1. 项目结构

```
server/
├── backend/                    # 后端项目根目录
│   ├── src/
│   ├── Dockerfile.prod         # 多阶段构建
│   ├── docker-compose.prod.yml # 生产编排
│   └── .env                    # 环境变量
├── frontend/                   # 前端项目根目录
│   ├── src/
│   ├── Dockerfile              # 前端构建
│   └── .env.production         # 前端环境变量
├── nginx/
│   ├── conf.d/
│   │   └── default.conf        # Nginx 配置
│   └── ssl/
│       ├── fullchain.pem       # SSL 证书
│       └── privkey.pem         # SSL 私钥
└── docker-compose.prod.yml     # 顶层编排
```

## 2. Linux 服务器前置准备

```bash
# 2.1 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | bash
sudo systemctl enable --now docker

# 2.2 安装 Docker Compose 插件
sudo apt-get install -y docker-compose-plugin

# 2.3 创建项目目录
mkdir -p /opt/river-guard/{backend,frontend,nginx/{conf.d,ssl}}
cd /opt/river-guard
```

## 3. 后端 Dockerfile（多阶段构建）

创建 `backend/Dockerfile.prod`：

```dockerfile
# ========== 阶段一：构建阶段 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json bun.lock ./
RUN npm install -g bun && bun install --frozen-lockfile

# 复制源码并构建
COPY . .
RUN bun run build

# ========== 阶段二：运行阶段 ==========
FROM node:20-alpine AS runner

WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache curl tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 只复制构建产物和生产依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD curl -f http://localhost:3000/api || exit 1

CMD ["node", "dist/main"]
```

## 4. 前端 Dockerfile

创建 `frontend/Dockerfile`：

```dockerfile
# ========== 阶段一：构建 ==========
FROM node:20-alpine AS builder

WORKDIR /app

# Next.js 独立输出模式配置
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

# 构建时注入后端 API 地址
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}

# 使用 standalone 输出模式
RUN npx next build

# ========== 阶段二：运行 ==========
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# 从构建阶段复制 standalone 产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3500

ENV PORT=3500
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

## 5. 前端 `next.config.ts` 修改

```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',  // ← 关键：独立部署模式
};

export default withNextIntl(nextConfig);
```

## 6. Nginx 反向代理配置

创建 `nginx/conf.d/default.conf`：

```nginx
# upstream 后端 API
upstream backend {
    server app:3000;
    keepalive 64;
}

# HTTP → HTTPS 强制跳转
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 配置
    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # 前端静态文件
    location / {
        proxy_pass http://frontend:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 透传 Authorization 头
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;

        # CORS 头（如需）
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # 预检请求直接返回
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
}
```

## 7. 生产环境 env 文件

创建 `backend/.env`：

```bash
# 数据库
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-strong-password-here
DB_NAME=river_guard

# JWT
JWT_SECRET=your-256-bit-strong-secret-here
JWT_EXPIRES_IN=7d

# 应用
NODE_ENV=production
PORT=3000
```

创建 `frontend/.env.production`：

```bash
NEXT_PUBLIC_BACKEND_URL=your-domain.com/api
```

## 8. 顶层 docker-compose.prod.yml

```yaml
services:
  # ─── PostgreSQL ───
  postgres:
    image: postgres:16-alpine
    container_name: river-guard-db
    restart: unless-stopped
    env_file: ./backend/.env
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-river_guard}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/docker/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - river-guard-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "127.0.0.1:5432:5432"  # 仅本地访问

  # ─── 后端 API ───
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: river-guard-backend
    restart: unless-stopped
    env_file: ./backend/.env
    environment:
      DB_HOST: postgres
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - river-guard-network
    command: >
      sh -c "
        node dist/scripts/check-db.js &&
        node dist/scripts/init-test-data.js &&
        node dist/main
      "

  # ─── 前端 Next.js ───
  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_BACKEND_URL: https://your-domain.com/api
    container_name: river-guard-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3500:3500"
    depends_on:
      - app
    networks:
      - river-guard-network

  # ─── Nginx 反向代理 ───
  nginx:
    image: nginx:1.27-alpine
    container_name: river-guard-nginx
    restart: unless-stopped
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_cache:/var/cache/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
      - frontend
    networks:
      - river-guard-network

volumes:
  postgres_data:
    driver: local
  nginx_cache:
    driver: local

networks:
  river-guard-network:
    driver: bridge
```

## 9. 部署命令

```bash
# 1. 上传代码到服务器
scp -r backend/ frontend/ nginx/ docker-compose.prod.yml root@your-server:/opt/river-guard/

# 2. 申请 SSL 证书
docker run -it --rm -p 80:80 \
  -v "/opt/river-guard/nginx/ssl:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d your-domain.com --email your-email@example.com

# 3. 启动所有服务
cd /opt/river-guard
docker compose -f docker-compose.prod.yml up -d

# 4. 查看部署状态
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f

# 5. 停止服务
docker compose -f docker-compose.prod.yml down

# 6. 更新服务（重新构建）
docker compose -f docker-compose.prod.yml up -d --build
```

---

# 方案二：PM2 + Systemd（传统方案）

如果不使用 Docker，也可以直接在 Linux 上用 PM2 管理进程。

## 后端部署

```bash
# 1. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. 安装 PM2
npm install -g pm2

# 3. 安装 PostgreSQL
apt-get install -y postgresql-16
systemctl enable --now postgresql

# 4. 创建数据库
sudo -u postgres psql -c "CREATE USER river_guard WITH PASSWORD 'strong-password';"
sudo -u postgres psql -c "CREATE DATABASE river_guard OWNER river_guard;"
sudo -u postgres psql -d river_guard -f /opt/river-guard/backend/docker/init-db.sql

# 5. 部署后端
cd /opt/river-guard/backend
npm install
npm run build

# 环境变量
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=river_guard
DB_PASSWORD=strong-password
DB_NAME=river_guard
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
EOF

# 6. PM2 启动
pm2 start dist/main.js --name river-guard-backend
pm2 save
pm2 startup systemd  # 开机自启
```

## 前端部署

```bash
# 1. 构建前端
cd /opt/river-guard/frontend
npm install
NEXT_PUBLIC_BACKEND_URL=https://your-domain.com/api npm run build

# 2. PM2 启动 Next.js
pm2 start npm --name river-guard-frontend -- start
pm2 save
```

## Nginx 配置（与 Docker 方案相同）

参考上方 Nginx 配置，将 `upstream` 指向 `localhost:3000`（后端）和 `localhost:3500`（前端）。

## Systemd 服务单元（可选）

```ini
# /etc/systemd/system/river-guard-backend.service
[Unit]
Description=River Guard Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/river-guard/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

---

# CI/CD 流水线（GitHub Actions）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        run: |
          docker compose -f docker-compose.prod.yml build
          docker save -o images.tar river-guard-app river-guard-frontend

      - name: Copy images to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          source: "images.tar,docker-compose.prod.yml,nginx/"
          target: "/opt/river-guard/"

      - name: Deploy on server
        uses: appleboy/ssh-action@v1.2.2
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/river-guard
            docker load -i images.tar
            docker compose -f docker-compose.prod.yml up -d --force-recreate
            docker image prune -f
```

---

# 关键安全配置

## 1. 数据库安全

```bash
# PostgreSQL 只允许本地连接
# /etc/postgresql/16/main/pg_hba.conf
host    all             all             127.0.0.1/32            scram-sha-256
# host    all             all             0.0.0.0/0               reject    ← 禁止远程连接
```

## 2. 防火墙

```bash
# 仅开放 Web 端口
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw enable
```

## 3. 自动 SSL 续期

```bash
# crontab -e 添加定时任务
0 3 * * * docker run --rm -v /opt/river-guard/nginx/ssl:/etc/letsencrypt certbot/certbot renew --quiet && docker exec river-guard-nginx nginx -s reload
```

## 4. 日志轮转

```bash
# /etc/logrotate.d/docker
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=100M
    missingok
    delaycompress
    copytruncate
}
```

## 5. 定期数据库备份

```bash
#!/bin/bash
# /opt/river-guard/scripts/backup.sh
BACKUP_DIR="/opt/backups/river-guard"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec river-guard-db pg_dump -U postgres river_guard | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 保留最近 30 天
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
```

```bash
# crontab -e
0 2 * * * /opt/river-guard/scripts/backup.sh
```

---

# 架构总览图

```
用户 ──HTTPS──▶ Nginx (443) ──▶ 前端 Next.js (:3500)
                              └─▶ 后端 API (:3000) ──▶ PostgreSQL (:5432)
                                    │
                                    └─ JWT 验证 ──▶ CASL 策略授权 ──▶ Controller
```

---

# 推荐方案总结

| 层面 | 推荐方案 | 理由 |
|------|---------|------|
| **容器化** | Docker Compose | 环境一致性、易于管理 |
| **反向代理** | Nginx | 性能好、配置灵活、SSL 终结 |
| **SSL** | Let's Encrypt + Certbot | 免费、自动续期 |
| **进程管理** | Docker 内置重启策略 | Docker 自带 `restart: unless-stopped` |
| **日志** | Docker 日志 + logrotate | 集中管理、自动轮转 |
| **备份** | cron + pg_dump | 轻量可靠、可恢复 |
| **CI/CD** | GitHub Actions | 与代码仓库集成、自动化部署 |
