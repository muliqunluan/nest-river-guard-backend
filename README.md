# River Guard 河流监控系统 - 后端服务

## 项目简介

River Guard（河流监控系统）是一个基于现代 Web 技术构建的全栈河流监控管理平台，通过 Jetson 边缘计算设备实现对河流环境的实时监控、智能告警与数据管理。本仓库为项目后端服务，为前端 Web 应用及 Jetson 设备提供 RESTful API。

---

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

---

## 核心功能

### 用户认证与授权
- JWT 用户登录/注册
- 基于角色的访问控制（RBAC）：管理员、编辑者、查看者
- 基于 CASL 的细粒度操作权限管理
- Swagger 自动生成交互式 API 文档

### 摄像头（Jetson 设备）管理
- 设备注册：Jetson 设备通过共享密钥（KEY）注册到系统，获取专属 JWT
- 状态上报：设备定期上报 GPS 坐标与在线状态
- 离线检测：服务端自动检测超时未上报的设备，标记为离线
- 设备列表查询与管理

### 事件管理
- 事件上报：Jetson 设备检测到异常（如垃圾漂浮物）时上报事件
- 事件查询：按类型、严重级别、时间范围、摄像头等条件筛选
- 事件状态更新：人工确认、处理事件

### 媒体文件管理
- 文件上传：支持图片（最高 5MB）和短视频（最高 50MB）
- 按类型/日期/设备自动归档存储
- 文件查询与预览，支持分页
- 与事件关联：事件可关联多张图片或视频

---

## 快速开始（本地开发）

### 环境要求

- Node.js >= 20.x 或 Bun 1.x
- PostgreSQL >= 12+

### 1. 安装依赖

```bash
git clone <repository-url>
cd nest-river-guard-backend

# 使用 npm
npm install

# 或使用 Bun（推荐）
bun install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填写数据库连接信息等配置
```

### 3. 启动开发服务器

```bash
bun run start:dev
```

开发服务器默认在 **http://localhost:3000** 启动。

### 4. 访问 API 文档

启动后访问 **http://localhost:3000/api-docs** 查看 Swagger 交互式 API 文档。

### 5. Docker 快速启动

```bash
docker compose up --build -d
```

---

## API 概览

### 认证 /api/auth

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | - |
| POST | /auth/login | 用户登录 | - |
| GET | /auth/me | 获取当前用户 | JWT |

### 摄像头 /api/cameras

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /cameras/register | 设备注册 | KEY |
| POST | /cameras/:id/status | 上报状态 | Camera JWT |
| GET | /cameras | 设备列表 | JWT |
| DELETE | /cameras/:id | 删除设备 | JWT |

### 事件 /api/events

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /events | 上报事件 | Camera JWT |
| GET | /events | 查询事件列表 | JWT |
| GET | /events/:id | 获取事件详情 | JWT |
| PATCH | /events/:id | 更新事件 | JWT |

### 媒体 /api/media

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /media/upload | 上传媒体文件 | Camera JWT |
| POST | /media/event/:eventId | 为事件上传媒体 | Camera JWT |
| GET | /media | 查询媒体列表 | JWT |
| GET | /media/:id/file | 获取媒体文件 | JWT |
| GET | /media/by-event/:eventId | 获取事件的媒体 | JWT |

详细 API 文档请参考 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## 测试账户

系统初始化后自动创建以下测试账户：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@test.com | admin123 |
| 编辑者 | editor@test.com | editor123 |
| 查看者 | viewer@test.com | viewer123 |
| 多角色 | multi@test.com | multi123 |

---

## 项目结构

```
src/
├── auth/               # 用户认证模块（JWT）
├── cameras/            # 摄像头设备管理
├── config/             # 全局配置
├── entities/           # TypeORM 实体定义
├── events/             # 事件管理
├── media/              # 媒体文件管理
├── permissions/        # 权限管理（CASL）
├── roles/              # 角色管理（RBAC）
├── users/              # 用户管理
├── scripts/            # 初始化脚本
├── main.ts             # 应用入口
└── app.module.ts       # 根模块
```
