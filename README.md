# River Guard 河流监控系统 - 后端服务

## 项目简介

River Guard 是一个基于现代 Web 技术构建的河流监控管理平台，通过 Jetson 边缘计算设备实现对河流环境的实时监控、智能告警与数据管理。本仓库为后端服务，为前端 Web 应用及 Jetson 设备提供 RESTful API。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | NestJS 11 + TypeScript |
| 运行时 | Node.js 20+ / Bun |
| 数据库 | PostgreSQL 15+ + TypeORM 0.3.x |
| 认证 | JWT（用户认证 + 摄像头设备认证） |
| 权限 | RBAC（基于角色）+ CASL（基于能力） |
| API 文档 | Swagger（@nestjs/swagger） |
| 文件上传 | Multer + 磁盘存储 |
| 容器化 | Docker + Docker Compose |

## 核心功能

- 用户认证与授权：JWT 登录/注册、RBAC 角色控制（管理员、编辑者、查看者）、CASL 细粒度操作权限、Swagger 交互式 API 文档。
- 摄像头（Jetson 设备）管理：设备通过共享密钥 KEY 注册并获取专属 JWT、定期上报 GPS 坐标与在线状态、服务端自动检测超时未上报的设备并标记离线、设备列表查询与管理。
- 事件管理：Jetson 设备上报异常事件（如垃圾漂浮物）、按类型/严重级别/时间范围/摄像头筛选、人工确认与状态更新。
- 媒体文件管理：支持图片（5MB）与视频（50MB）上传、按类型/日期/设备自动归档、分页查询与预览、与事件关联。

## 项目结构

```
src/
├── main.ts               # 应用入口
├── app.module.ts         # 根模块
├── cli.ts                # CLI 入口
├── config/               # 全局配置
├── entities/             # TypeORM 实体定义
├── auth/                 # 用户认证（JWT）
├── cameras/              # 摄像头设备管理
├── events/               # 事件管理
├── media/                # 媒体文件管理
├── permissions/          # 权限管理（CASL）
├── roles/                # 角色管理（RBAC）
├── user/                 # 用户管理
├── common/               # 公共组件（拦截器）
└── scripts/              # 初始化与数据库检查脚本
```

## 环境配置

复制 `.env.example` 为 `.env` 并填写以下配置：

| 变量 | 说明 |
|------|------|
| `KEY` | 摄像头注册共享密钥，生产环境用 `openssl rand -hex 32` 生成 |
| `CAMERA_OFFLINE_TIMEOUT` | 摄像头离线超时秒数，超时未上报则自动标记离线 |
| `UPLOAD_DIR` | 文件上传目录，默认 `./uploads` |
| `MAX_IMAGE_SIZE` | 图片大小上限，默认 `5242880`（5MB） |
| `MAX_VIDEO_SIZE` | 视频大小上限，默认 `52428800`（50MB） |
| `PG_USERNAME` | 数据库用户名，默认 `postgres` |
| `PG_PASSWORD` | 数据库密码 |
| `DB_NAME` | 数据库名，默认 `river_guard` |
| `DB_HOST` | 数据库地址，本地为 `localhost`，Docker 内为 `postgres` |
| `DB_PORT` | 数据库端口，默认 `5432` |
| `JWT_SECRET` | JWT 密钥，生产环境必须改为强随机值 |
| `JWT_EXPIRES_IN` | JWT 有效期，默认 `7d` |
| `PORT` | 服务端口，默认 `3000` |

## 快速开始

### 环境要求

- Node.js >= 20.x 或 Bun 1.x
- PostgreSQL >= 12+（Docker 部署时无需手动安装）

### 本地开发

```bash
git clone <repository-url>
cd nest-river-guard-backend

# 使用 npm
npm install

# 或使用 Bun（推荐）
bun install
```

复制并编辑环境变量：

```bash
cp .env.example .env
```

启动开发服务器：

```bash
bun run start:dev
```

开发服务器默认在 `http://localhost:3000` 启动。

### 初始化测试数据

```bash
bun run build
node dist/scripts/init-test-data.js
```

### API 文档

启动后访问 `http://localhost:3000/api-docs` 查看 Swagger 交互式 API 文档。

## 数据库初始化

数据库初始化分为两个阶段：

1. 容器启动时执行 `docker/init-db.sql` 创建表结构和基础数据。
2. 应用启动后执行 `src/scripts/init-test-data.ts` 创建测试用户和角色。

## 测试账户

系统初始化后自动创建以下测试账户：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@test.com | admin123 |
| 编辑者 | editor@test.com | editor123 |
| 查看者 | viewer@test.com | viewer123 |
| 多角色 | multi@test.com | multi123 |

## API 接口

### 基础信息

- 基础 URL：`http://localhost:7050/api`
- 认证方式：JWT Bearer Token
- 数据格式：JSON

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 用户注册，返回访问令牌 | 无 |
| POST | `/auth/login` | 用户登录，返回访问令牌 | 无 |
| GET | `/auth/me` | 获取当前登录用户信息 | JWT |

注册请求体：

```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "张",
  "last_name": "三"
}
```

登录请求体：

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

响应示例：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户管理接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/users/profile` | 获取当前用户资料 | 登录 |
| GET | `/users/:id` | 通过 ID 获取用户信息 | 登录 |
| GET | `/users/email/:email` | 通过邮箱获取用户信息 | 登录 |
| PUT | `/users/:id/roles` | 更新用户角色列表 | 管理员 |
| POST | `/users/:id/roles` | 为用户分配单个角色 | 管理员 |
| DELETE | `/users/:id/roles/:roleName` | 移除用户角色 | 管理员 |
| GET | `/users/:id/roles/names` | 获取用户角色名称列表 | 登录 |

### 角色管理接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/roles` | 获取所有角色 | 登录 |
| GET | `/roles/:id` | 通过 ID 获取角色 | 登录 |
| POST | `/roles` | 创建新角色 | 管理员 |
| PUT | `/roles/:id` | 更新角色 | 管理员 |
| DELETE | `/roles/:id` | 删除角色 | 管理员 |
| GET | `/roles/:id/permissions` | 获取角色权限 | 登录 |
| POST | `/roles/assign-to-user` | 通过邮箱为用户分配角色 | 管理员 |
| DELETE | `/roles/remove-from-user` | 通过邮箱从用户移除角色 | 管理员 |
| POST | `/roles/:id/permissions` | 为角色分配权限 | 管理员 |
| DELETE | `/roles/:id/permissions/:permissionId` | 移除角色权限 | 管理员 |
| GET | `/roles/:id/users` | 获取拥有指定角色的用户 | 登录 |

### 摄像头接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/cameras/register` | 设备注册 | KEY |
| POST | `/cameras/:id/status` | 上报状态 | Camera JWT |
| GET | `/cameras` | 设备列表 | JWT |
| DELETE | `/cameras/:id` | 删除设备 | JWT |

### 事件接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/events` | 上报事件 | Camera JWT |
| GET | `/events` | 查询事件列表 | JWT |
| GET | `/events/:id` | 获取事件详情 | JWT |
| PATCH | `/events/:id` | 更新事件 | JWT |

### 媒体接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/media/upload` | 上传媒体文件 | Camera JWT |
| POST | `/media/event/:eventId` | 为事件上传媒体 | Camera JWT |
| GET | `/media` | 查询媒体列表 | JWT |
| GET | `/media/:id/file` | 获取媒体文件 | JWT |
| GET | `/media/by-event/:eventId` | 获取事件的媒体 | JWT |

### 错误响应

所有 API 出错时返回统一格式：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

常见错误码：

| 状态码 | 说明 |
|------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如邮箱已存在） |
| 500 | 服务器内部错误 |

## 权限系统

系统使用 RBAC + CASL 进行基于能力的权限控制：

| 角色 | 说明 |
|------|------|
| admin | 管理员，拥有所有权限 |
| editor | 编辑者，可管理特定资源 |
| viewer | 查看者，只读访问权限 |

| 动作 | 说明 |
|------|------|
| create | 创建资源 |
| read | 读取资源 |
| update | 更新资源 |
| delete | 删除资源 |
| manage | 管理资源（所有操作） |

资源类型：User（用户）、Role（角色）、Permission（权限）。

在控制器中使用策略守卫：

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies(Policies.canManage('admin-panel'))
export class UserController {
  // 只有管理员可以访问此端点
}
```

管理员（`admin` 角色）拥有 `manage` 所有资源的权限，非管理员用户只能操作自己的信息。

## Docker 部署

### 前提条件

1. 安装 Docker Desktop（Windows/Mac）或 Docker Engine（Linux）。
2. 确保 Docker 已启动并运行（Windows 检查系统托盘 Docker 图标）。
3. 验证安装：

```bash
docker --version
docker info
```

### 启动服务

```bash
docker compose up --build -d
```

### 服务说明

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| app | node:20-alpine | 容器内 3000，主机 7050 | NestJS 应用 |
| postgres | postgres:15-alpine | 5432 | PostgreSQL 数据库，数据持久化于 `postgres_data` 卷，启动时执行 `docker/init-db.sql` |

应用容器启动时会依次执行：检查数据库连接、构建应用、初始化测试数据、启动服务。应用与数据库通过内部网络 `postgres:5432` 连接，数据库端口不对宿主机发布。

### 验证服务

```bash
docker compose ps
docker compose logs app
docker compose logs postgres

# 测试登录 API
curl -X POST http://localhost:7050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### 常用命令

```bash
docker compose up -d              # 启动
docker compose down               # 停止
docker compose restart            # 重启
docker compose up --build         # 重新构建并启动
docker compose logs -f app        # 跟踪应用日志

# 连接数据库
docker compose exec postgres psql -U postgres -d river_guard

# 备份与恢复
docker compose exec postgres pg_dump -U postgres river_guard > backup.sql
docker compose exec -T postgres psql -U postgres river_guard < backup.sql
```

### 故障排除

| 问题 | 解决方案 |
|------|------|
| Docker 连接错误（Docker Desktop 未启动） | 启动 Docker Desktop 或重启 |
| 端口冲突 | 修改 `docker-compose.yml` 端口映射，或停止占用端口的服务 |
| 数据库连接失败 | 检查数据库服务状态、环境变量与数据库日志 |

### 清理

```bash
docker compose down                # 停止并删除容器
docker compose down -v             # 删除容器与数据卷（删除数据，谨慎操作）
docker compose down --rmi all      # 删除容器与镜像
```

## 生产部署

### 环境准备

系统要求：Ubuntu 20.04+ / CentOS 7+ / Debian 11+，最低 2 核 CPU、2GB 内存、20GB 磁盘，开放 `8080`（Nginx 监听）与 `22`（SSH）端口。

安装基础工具：

```bash
# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget vim

# CentOS / Rocky
sudo yum install -y curl wget git vim
```

Ubuntu 默认 apt 源的 Git 使用 GnuTLS 编译，可能导致 `git pull` 无反应，建议通过官方 PPA 安装 OpenSSL 编译版：

```bash
sudo add-apt-repository ppa:git-core/ppa -y
sudo apt update
sudo apt install git -y
```

安装 Docker：

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

安装 Bun：

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

安装 Nginx：

```bash
sudo apt install -y nginx
nginx -v
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 获取代码

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/muliqunluan/gis-platform-backend.git
mv gis-platform-backend nest-river-guard-backend

git clone <前端仓库URL>
mv <前端目录名> next-river-guard-front
```

### 后端部署

```bash
cd ~/apps/nest-river-guard-backend
cp .env.example .env
vim .env
```

生产环境必须修改 `KEY`、`PG_PASSWORD`、`JWT_SECRET`，密钥使用以下命令生成：

```bash
openssl rand -hex 32
```

构建并启动：

```bash
docker compose up -d --build
docker compose logs -f app
```

看到 `Nest application successfully started` 即启动成功。验证容器：

```bash
docker ps
```

| 容器名 | 端口映射 | 说明 |
|--------|---------|------|
| river-guard-backend | 7050 -> 3000 | NestJS 应用 |
| river-guard-db | 5432 | PostgreSQL 数据库 |

### 前端部署

```bash
cd ~/apps/next-river-guard-front
cp .env.local.example .env.local
vim .env.local
```

生产环境通过 Nginx 反向代理 API，前端使用 `/api` 相对路径，因此 `NEXT_PUBLIC_BACKEND_URL` 留空：

```env
NEXT_PUBLIC_BACKEND_URL=
```

安装依赖并构建：

```bash
bun install
bun run build
```

后台启动（端口 3500）：

```bash
nohup bun run start > frontend.log 2>&1 &
```

验证：

```bash
curl http://localhost:3500
```

### Nginx 反向代理配置

创建配置文件：

```bash
sudo vim /etc/nginx/sites-available/river-guard
```

```nginx
server {
    listen 8080;
    server_name _;  # 有域名则替换，如 river-guard.example.com

    # 允许上传最大 50MB 文件（与后端 MAX_VIDEO_SIZE 一致）
    client_max_body_size 50M;

    # 媒体文件代理 -> Next.js（<img>/<video> 无法携带 Authorization 头，
    # Next.js 代理路由从 cookie 读取 auth_token 转为 Bearer 头）
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

    # 前端页面 -> Next.js
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

    # 后端 API -> NestJS
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

启用站点并重启：

```bash
sudo ln -s /etc/nginx/sites-available/river-guard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 防火墙

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 8080/tcp    # River Guard Web
sudo ufw enable
sudo ufw status
```

云服务器还需在控制台「安全组」中开放 `8080` 端口。

### 验证完整部署

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
# 应返回 200

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
# 应返回包含 access_token 的 JSON
```

### 端口对照表

| 服务 | 容器内端口 | 主机端口 | 说明 |
|------|:---------:|:--------:|------|
| Nginx | - | 8080 | 对外访问入口 |
| Next.js（前端） | - | 3500 | 前端应用 |
| NestJS（后端） | 3000 | 7050 | 后端 API |
| PostgreSQL | 5432 | 5432 | 数据库 |

## 注意事项

- 生产环境务必更改 `JWT_SECRET` 与 `KEY`，使用强密码，并配置 HTTPS。
- 开发环境使用 `synchronize: true` 自动同步表结构，生产环境建议关闭并使用迁移脚本。
- 启动应用后访问 `http://localhost:7050/api-docs` 查看 Swagger 文档。
