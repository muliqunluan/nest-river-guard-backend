# River Guard 使用指南

## 概述

River Guard 是一个基于 NestJS 构建的用户认证与权限管理系统（RBAC），提供用户注册登录、用户管理、角色管理和权限控制等基础功能。

## 技术栈

- **框架**: NestJS 11
- **语言**: TypeScript
- **数据库**: PostgreSQL
- **ORM**: TypeORM
- **认证**: JWT (JSON Web Token)
- **权限**: CASL (Ability-based authorization)
- **API 文档**: Swagger (OpenAPI)

## 文件结构

```
src/
├── main.ts                        # 应用入口
├── app.module.ts                  # 主应用模块
├── cli.ts                         # CLI 入口
├── config/
│   └── configuration.ts           # 配置管理
├── auth/
│   ├── auth.module.ts             # 认证模块
│   ├── auth.controller.ts         # 认证控制器
│   ├── auth.service.ts            # 认证服务
│   ├── decorators/
│   │   └── roles.decorator.ts     # 角色装饰器
│   ├── enums/
│   │   └── role.enum.ts           # 角色枚举
│   └── guards/
│       ├── jwt-auth.guard.ts      # JWT 认证守卫
│       └── roles.guard.ts         # 角色守卫
├── user/
│   ├── user.module.ts             # 用户模块
│   ├── user.service.ts            # 用户服务
│   ├── user.controller.ts         # 用户控制器
│   └── dto/                       # 用户相关 DTO
├── roles/
│   ├── roles.module.ts            # 角色模块
│   ├── roles.service.ts           # 角色服务
│   ├── roles.controller.ts        # 角色控制器
│   └── dto/                       # 角色相关 DTO
├── permissions/
│   ├── permissions.module.ts      # 权限模块
│   ├── casl-ability.factory.ts    # CASL 能力工厂
│   ├── decorators/
│   │   └── policies.decorator.ts  # 策略装饰器
│   ├── enums/
│   │   └── action.enum.ts         # 动作枚举
│   └── guards/
│       ├── policies.guard.ts      # 策略守卫
│       └── admin.guard.ts         # 管理员守卫
├── entities/
│   ├── user.entity.ts             # 用户实体
│   ├── role.entity.ts             # 角色实体
│   ├── permission.entity.ts       # 权限实体
│   └── role-permission.entity.ts  # 角色权限关联实体
├── common/
│   └── interceptors/
│       └── response.interceptor.ts # 响应拦截器
└── scripts/
    ├── check-db.ts                # 数据库检查脚本
    └── init-test-data.ts          # 测试数据初始化脚本
```

## 环境配置

确保 `.env` 文件包含以下配置：

```env
PORT=7050
PG_USERNAME="postgres"
PG_PASSWORD="12100"
DB_NAME="river_guard"
DB_HOST="localhost"
DB_PORT="5432"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

## 快速开始

### 1. 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器（需要先启动 PostgreSQL）
bun run start:dev
```

### 2. 使用 Docker

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

### 3. 初始化测试数据

```bash
# 使用 CLI 命令初始化测试数据
bun run build
node dist/scripts/init-test-data.js
```

测试账户：
- 管理员: admin@test.com / admin123
- 编辑者: editor@test.com / editor123
- 查看者: viewer@test.com / viewer123
- 多角色: multi@test.com / multi123

## API 使用

### 认证

```bash
# 注册
curl -X POST http://localhost:7050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 登录
curl -X POST http://localhost:7050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### 用户管理

```bash
# 获取当前用户信息
curl -X GET http://localhost:7050/api/users/profile \
  -H "Authorization: Bearer <token>"

# 获取指定用户信息
curl -X GET http://localhost:7050/api/users/1 \
  -H "Authorization: Bearer <token>"
```

### 角色管理

```bash
# 获取所有角色
curl -X GET http://localhost:7050/api/roles \
  -H "Authorization: Bearer <token>"

# 创建角色（需要管理员权限）
curl -X POST http://localhost:7050/api/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"new-role"}'
```

## 权限控制

系统使用 CASL 进行基于能力的权限控制：

```typescript
// 在控制器中使用策略守卫
@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies(Policies.canManage('admin-panel'))
export class UserController {
  // 只有管理员可以访问此端点
}
```

管理员 (`admin` 角色) 拥有 `manage` 所有资源的权限。非管理员用户只能操作自己的信息。

## Docker 部署

```bash
# 构建并启动
docker-compose up -d --build

# 停止服务
docker-compose down

# 查看状态
docker-compose ps
```

## 注意事项

1. **安全性**
   - 生产环境中务必更改 `JWT_SECRET`
   - 使用强密码策略
   - 配置 HTTPS

2. **数据库**
   - 开发环境使用 `synchronize: true` 自动同步表结构
   - 生产环境建议关闭 `synchronize` 并使用迁移脚本

3. **API 文档**
   - 启动应用后访问 `http://localhost:7050/api-docs` 查看 Swagger 文档
