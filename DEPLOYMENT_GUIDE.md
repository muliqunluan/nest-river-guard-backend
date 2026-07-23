# River Guard 项目部署指南

---

## 目录

1. [环境准备](#1-环境准备)
2. [获取代码](#2-获取代码)
3. [后端部署](#3-后端部署)
4. [前端部署](#4-前端部署)
5. [Nginx 反向代理配置](#5-nginx-反向代理配置)

---

## 1. 环境准备

### 1.1 系统要求

- **操作系统**：Ubuntu 20.04+ / CentOS 7+ / Debian 11+
- **最低配置**：2 核 CPU、2GB 内存、20GB 磁盘
- **需开放的端口**：`8080`（Nginx 监听）、`22`（SSH）

### 1.2 安装基础工具

```bash
# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget vim

# CentOS / Rocky
sudo yum install -y curl wget git vim
```

> **⚠️ Git 安装说明**：Ubuntu 默认 apt 源的 Git 使用 GnuTLS 编译，实测 `git pull` 可能无反应。建议通过官方 PPA 安装 OpenSSL 编译版：

```bash
# 第1步：添加 Git 官方 PPA（提供 OpenSSL 编译版）
sudo add-apt-repository ppa:git-core/ppa -y

# 第2步：更新软件源
sudo apt update

# 第3步：安装 Git（PPA 版本默认使用 OpenSSL）
sudo apt install git -y
```

### 1.3 安装 Docker

```bash
# 使用官方脚本一键安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户加入 docker 组（避免每次 sudo）
sudo usermod -aG docker $USER

# 使组生效（重新登录或执行以下命令）
newgrp docker

# 验证安装
docker --version
docker compose version
```

> **注意**：安装后需要**重新登录 SSH**（`exit` 再重新连接），`docker` 组权限才会生效。

### 1.4 安装 Bun

```bash
# 使用官方脚本安装 Bun
curl -fsSL https://bun.sh/install | bash

# 将 Bun 加入 PATH（重新登录后自动生效，或手动执行）
source ~/.bashrc

# 验证安装
bun --version
```

### 1.5 安装 Nginx

```bash
sudo apt install -y nginx

# 验证
nginx -v

# 设置开机自启并启动
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 2. 获取代码

```bash
# 创建项目目录
mkdir -p ~/apps && cd ~/apps

# 克隆后端代码
git clone https://github.com/muliqunluan/gis-platform-backend.git
mv gis-platform-backend nest-river-guard-backend

# 克隆前端代码
git clone <前端仓库URL>
mv <前端目录名> next-river-guard-front
```

---

## 3. 后端部署

### 3.1 配置环境变量

```bash
cd ~/apps/nest-river-guard-backend

# 从模板创建 .env 文件
cp .env.example .env

# 编辑环境变量
vim .env
```

填写以下配置：

```env
# ★ 必须修改：摄像头注册密钥
# 生产环境请使用以下命令生成强随机密钥：
#   openssl rand -hex 32
KEY=sk-prod-8f3a2b1c9d4e7f6a0b2c3d4e5f6a7b8c

# 摄像头离线超时时间（秒）
CAMERA_OFFLINE_TIMEOUT=30

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_IMAGE_SIZE=5242880        # 5MB
MAX_VIDEO_SIZE=52428800       # 50MB

# ★ 必须修改：数据库连接配置
PG_USERNAME=postgres
PG_PASSWORD=your-strong-db-password    # 改为强密码
DB_NAME=river_guard
DB_HOST=postgres
DB_PORT=5432

# ★ 必须修改：JWT 密钥
# 同样使用 openssl rand -hex 32 生成
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d

# 服务端口（容器内 3000，映射到主机 7050）
PORT=3000
```

### 3.2 生成安全密钥

```bash
# 生成 32 字节（64 字符）随机十六进制密钥
openssl rand -hex 32
# 输出示例: 8f3a2b1c9d4e7f6a0b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f

# 将生成的字符串分别填入 KEY 和 JWT_SECRET
```

### 3.3 构建并启动

```bash
cd ~/apps/nest-river-guard-backend

# 构建镜像并启动所有容器（后台运行）
docker compose up -d --build

# 查看启动日志
docker compose logs -f app
```

等待约 30-60 秒，看到以下输出即启动成功：

```
[NestApplication] Nest application successfully started
应用正在运行: http://localhost:3000
API 文档地址: http://localhost:3000/api-docs
```

按 `Ctrl+C` 退出日志查看。

验证容器运行状态：

```bash
docker ps
```

应看到两个容器在运行：

| 容器名 | 端口映射 | 说明 |
|--------|---------|------|
| `river-guard-backend` | `7050 → 3000` | NestJS 应用 |
| `river-guard-db` | `5432` | PostgreSQL 数据库 |

---

## 4. 前端部署

### 4.1 配置环境变量

```bash
cd ~/apps/next-river-guard-front

# 从模板创建 .env.local 文件
cp .env.local.example .env.local

# 编辑环境变量
vim .env.local
```

```env
# 生产环境通过 Nginx 反向代理 API，前端使用 /api 相对路径
# 因此留空即可
NEXT_PUBLIC_BACKEND_URL=
```

### 4.2 安装依赖

```bash
cd ~/apps/next-river-guard-front

# 使用 Bun 安装依赖
bun install
```

### 4.3 构建生产版本

```bash
cd ~/apps/next-river-guard-front

bun run build
```

### 4.4 启动服务

```bash
cd ~/apps/next-river-guard-front

# 后台运行（端口 3500，与 package.json 中 dev 脚本一致）
# 使用 nohup 使其在 SSH 断开后继续运行
nohup bun run start > frontend.log 2>&1 &
```

> **注意**：`bun run start` 对应 `next start -p 3500`，默认端口与后端 Nginx 配置中的 `proxy_pass http://127.0.0.1:3500` 一致。

### 4.5 验证前端

```bash
curl http://localhost:3500
# 应返回 HTML 页面内容
```

---

## 5. Nginx 反向代理配置

### 5.1 创建配置文件

```bash
sudo vim /etc/nginx/sites-available/river-guard
```

粘贴以下完整配置：

```nginx
server {
    listen 8080;
    server_name _;  # 有域名则替换，如 river-guard.example.com

    # 允许上传最大 50MB 文件（与后端 MAX_VIDEO_SIZE 一致）
    client_max_body_size 50M;

    # ============================================
    # 媒体文件代理 → Next.js
    # 浏览器 <img>/<video> 标签无法携带 Authorization 头，
    # Next.js 代理路由从 cookie 读取 auth_token 并转为 Bearer 头
    # ============================================
    location ~ ^/api/media/\d+/file$ {
        proxy_pass http://127.0.0.1:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ============================================
    # 前端页面 → Next.js
    # ============================================
    location / {
        proxy_pass http://127.0.0.1:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ============================================
    # 后端 API → NestJS
    # ============================================
    location /api/ {
        proxy_pass http://127.0.0.1:7050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 大文件上传必需配置
        proxy_request_buffering off;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

### 5.2 启用站点并重启 Nginx

```bash
# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/river-guard /etc/nginx/sites-enabled/

# 禁用默认站点（避免冲突）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置语法
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5.3 防火墙

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 8080/tcp     # River Guard Web
sudo ufw enable
sudo ufw status

# 如果服务器在云服务商（阿里云、腾讯云、AWS 等），
# 还需在云控制台的「安全组」中开放端口 8080
```

### 5.4 验证完整部署

```bash
# 测试前端（通过 Nginx）
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
# 应返回 200

# 测试登录 API（通过 Nginx）
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
# 应返回包含 access_token 的 JSON
```

### 5.5 测试账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | `admin@test.com` | `admin123` |
| 编辑者 | `editor@test.com` | `editor123` |
| 查看者 | `viewer@test.com` | `viewer123` |
| 多角色 | `multi@test.com` | `multi123` |

### 5.6 端口对照表

| 服务 | 容器内端口 | 主机端口 | 说明 |
|------|:---------:|:--------:|------|
| Nginx | - | `8080` | 对外访问入口 |
| Next.js (前端) | - | `3500` | 前端应用 |
| NestJS (后端) | `3000` | `7050` | 后端 API |
| PostgreSQL | `5432` | `5432` | 数据库 |
