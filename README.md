# River Guard 河流监控系统 - 后端服务

## 项目介绍

**River Guard（河流监控系统）** 是一个基于现代 Web 技术构建的全栈河流监控管理平台。本项目是其**后端服务**，为前端提供 RESTful API 支持，采用以下技术栈：

- **框架**：[NestJS 11](https://nestjs.com) + [TypeScript](https://www.typescriptlang.org)
- **运行时**：Node.js 18+ / Bun
- **编译工具**：SWC（通过 `@swc/core`）
- **数据库**：[PostgreSQL](https://www.postgresql.org) 15+ + [TypeORM](https://typeorm.io) 0.3.x
- **认证与授权**：
  - JWT 认证（`@nestjs/jwt`）
  - 基于角色的访问控制（RBAC）
  - 基于能力的权限管理（[CASL](https://casl.js.org)）
- **密码加密**：[bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **数据验证**：[class-validator](https://github.com/typestack/class-validator) + [class-transformer](https://github.com/typestack/class-transformer)
- **API 文档**：[Swagger](https://swagger.io)（`@nestjs/swagger` + `swagger-ui-express`）
- **代码规范**：ESLint + Prettier
- **容器化**：Docker + Docker Compose

### 已实现功能

- **用户注册与登录**：基于 JWT 的认证机制，注册后自动返回访问令牌
- **用户信息查询**：获取当前登录用户的详细信息
- **基于角色的访问控制（RBAC）**：
  - 角色管理：创建、查询、更新、删除角色
  - 用户-角色分配：为用户分配或移除角色
  - 受保护用户机制：保护管理员账号不可被降权
- **基于能力的权限管理（CASL）**：细粒度的操作权限控制
- **Swagger API 文档**：自动生成可交互的 API 文档页面
- **统一的响应格式**：通过全局拦截器标准化 API 响应结构
- **Docker 容器化部署**：一键启动 PostgreSQL 数据库和后端应用
- **测试数据初始化**：自动创建管理员/编辑者/查看者等测试账户

## 启动方法

### 环境要求

- [Node.js](https://nodejs.org) >= 18.x 或 [Bun](https://bun.sh) 1.x
- [PostgreSQL](https://www.postgresql.org) >= 12+
- [Docker](https://www.docker.com)（可选，用于容器化部署）

### 1. 克隆项目

```bash
git clone <repository-url>
cd nest-river-guard-backend
```

### 2. 安装依赖

使用 npm：

```bash
npm install
```

或使用 Bun：

```bash
bun install
```

### 3. 配置环境变量

复制环境变量示例文件并进行配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写以下配置：

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 应用监听端口 | `3000` | 否 |
| `DB_HOST` | 数据库主机地址 | `localhost` | 否 |
| `DB_PORT` | 数据库端口 | `5432` | 否 |
| `DB_USERNAME` / `PG_USERNAME` | 数据库用户名 | `postgres` | 否 |
| `DB_PASSWORD` / `PG_PASSWORD` | 数据库密码 | — | **是** |
| `DB_NAME` | 数据库名称 | `river_guard` | 否 |
| `JWT_SECRET` | JWT 签名密钥 | 默认值（生产环境务必修改） | 否 |
| `JWT_EXPIRES_IN` | JWT 令牌过期时间 | `7d` | 否 |

### 4. 启动开发服务器

```bash
# 热重载开发模式（推荐）
bun run start:dev
```

开发服务器默认在 **http://localhost:3000** 启动。

### 5. 访问 API 文档

启动后访问 **http://localhost:3000/api-docs** 查看 Swagger 交互式 API 文档。

### 6. 构建生产版本

```bash
bun run build
```

构建完成后，使用以下命令启动生产服务器：

```bash
bun run start:prod
```

## Docker 快速启动

项目支持通过 Docker Compose 一键启动 PostgreSQL 数据库和后端应用：

```bash
# 构建并启动所有服务（前台运行，查看日志）
docker compose up --build

# 或后台启动
docker compose up --build -d
```

首次启动会自动完成以下操作：
1. 启动 PostgreSQL 数据库并初始化表结构
2. 构建 NestJS 应用
3. 检查数据库连接
4. 初始化测试数据（管理员/编辑者/查看者账户）
5. 启动应用服务（端口 **7050**）

启动后访问：**http://localhost:7050/api-docs**（Swagger 文档）

### 查看运行状态

```bash
# 查看所有服务状态
docker compose ps

# 查看应用日志
docker compose logs -f app

# 查看数据库日志
docker compose logs -f postgres
```

### 停止服务

```bash
docker compose down
```

## 测试账户

初始化测试数据后，可使用以下账户登录：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@test.com | admin123 |
| 编辑者 | editor@test.com | editor123 |
| 查看者 | viewer@test.com | viewer123 |
| 多角色 | multi@test.com | multi123 |

## API 概览

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 用户管理接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users/email/:email` | 通过邮箱搜索用户 |
| GET | `/api/users/profile` | 获取当前用户资料 |
| GET | `/api/users/:id` | 通过 ID 获取用户信息 |
| PUT | `/api/users/:id/roles` | 更新用户角色 |
| POST | `/api/users/:id/roles` | 为用户分配角色 |
| DELETE | `/api/users/:id/roles/:roleName` | 移除用户角色 |

### 角色管理接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/roles` | 获取所有角色 |
| POST | `/api/roles` | 创建角色 |
| PUT | `/api/roles/:id` | 更新角色 |
| DELETE | `/api/roles/:id` | 删除角色 |
| POST | `/api/roles/:id/permissions` | 为角色分配权限 |
| GET | `/api/roles/:id/users` | 获取拥有指定角色的用户列表 |

详细 API 文档请参考 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 可用命令

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动开发服务器 |
| `bun run start:dev` | 热重载模式启动开发服务器 |
| `bun run start:debug` | 调试模式启动 |
| `bun run build` | 构建生产版本 |
| `bun run start:prod` | 启动生产服务器 |
| `bun run lint` | 运行 ESLint 代码检查 |
| `bun run format` | 使用 Prettier 格式化代码 |
| `bun run test` | 运行单元测试 |
| `bun run test:watch` | 监听模式运行测试 |
| `bun run test:cov` | 运行测试并生成覆盖率报告 |
| `bun run test:e2e` | 运行端到端测试 |
