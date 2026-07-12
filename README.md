<h1 align="center">River Guard 后端服务</h1>

<p align="center">
  <strong>基于 NestJS 构建的用户认证与权限管理系统</strong>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
</p>

## 技术栈

### 核心框架
- **NestJS**: 11.x
- **运行时**: Node.js 18+ / Bun 1.x
- **包管理器**: Bun
- **编译工具**: SWC (通过 @swc/core)
- **代码规范**: ESLint + Prettier

### 数据库与ORM
- **PostgreSQL**: 通过 pg 驱动
- **TypeORM**: 0.3.x
- **数据验证**: class-validator + class-transformer

### 安全与认证
- **认证**: @nestjs/jwt
- **加密**: bcryptjs 3.x
- **权限**: CASL (Ability-based authorization)

### API 文档
- **Swagger**: @nestjs/swagger + swagger-ui-express

## 功能特性

- ✅ 用户注册与登录（JWT 认证）
- ✅ 基于角色的访问控制（RBAC）
- ✅ 基于能力的权限管理（CASL）
- ✅ 完整的用户 CRUD 管理
- ✅ 角色与权限的灵活分配
- ✅ Swagger API 文档自动生成
- ✅ Docker 容器化部署

## 开发环境配置

### 系统要求
- Node.js 18+ 或 Bun 1.x
- PostgreSQL 12+

### 安装步骤

```bash
# 安装依赖
bun install

# 配置环境变量
cp .env.example .env

# 启动开发服务器（支持热重载）
bun run start:dev
```

## Docker 快速启动

### 一键启动（推荐）

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
5. 启动应用服务（端口 `7050`）

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
| GET | `/api/users/profile` | 获取当前用户资料 |
| GET | `/api/users/:id` | 通过ID获取用户信息 |
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

详细 API 文档请参考 [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 测试账户

初始化测试数据后，可使用以下账户登录：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@test.com | admin123 |
| 编辑者 | editor@test.com | editor123 |
| 查看者 | viewer@test.com | viewer123 |
| 多角色 | multi@test.com | multi123 |

## 开发与测试

```bash
# 运行单元测试
bun run test

# 监听模式运行测试
bun run test:watch

# 运行测试并生成覆盖率报告
bun run test:cov

# 代码检查
bun run lint

# 格式化代码
bun run format
```

## 项目结构

```
src/
├── main.ts                        # 应用入口
├── app.module.ts                  # 主应用模块
├── cli.ts                         # CLI 入口
├── config/                        # 配置管理
├── auth/                          # 认证模块
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/                    # JWT认证守卫、角色守卫
│   └── decorators/                # 角色装饰器
├── user/                          # 用户模块
│   ├── user.module.ts
│   ├── user.service.ts
│   ├── user.controller.ts
│   └── dto/                       # 数据传输对象
├── roles/                         # 角色模块
│   ├── roles.module.ts
│   ├── roles.service.ts
│   ├── roles.controller.ts
│   └── dto/                       # 数据传输对象
├── permissions/                   # 权限模块
│   ├── casl-ability.factory.ts    # CASL 能力工厂
│   ├── guards/                    # 策略守卫、管理员守卫
│   └── decorators/                # 策略装饰器
├── entities/                      # 数据库实体
│   ├── user.entity.ts
│   ├── role.entity.ts
│   ├── permission.entity.ts
│   └── role-permission.entity.ts
└── common/                        # 公共模块
    └── interceptors/              # 响应拦截器
```
