# River Guard API 文档

## 概述

River Guard 是一个基于 NestJS 构建的用户认证与权限管理系统，提供用户注册登录、用户管理、角色管理、权限控制等功能。

## 基础信息

- **基础URL**: `http://localhost:7050/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证接口

### 用户注册

**POST** `/auth/register`

注册新用户并返回访问令牌。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "张",
  "last_name": "三"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 用户登录

**POST** `/auth/login`

用户登录并返回访问令牌。

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 获取当前用户信息

**GET** `/auth/me`

获取当前登录用户的详细信息。

**请求头**:
```
Authorization: Bearer <access_token>
```

**响应**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "张",
  "last_name": "三",
  "is_active": true,
  "roles": ["viewer"]
}
```

## 用户管理接口

### 获取当前用户资料

**GET** `/users/profile`

获取当前登录用户的详细信息。

**权限要求**: 需要登录

**请求头**:
```
Authorization: Bearer <access_token>
```

### 通过ID获取用户信息

**GET** `/users/:id`

根据用户ID获取用户详细信息。

**权限要求**: 需要登录

### 通过邮箱获取用户信息

**GET** `/users/email/:email`

根据用户邮箱获取用户详细信息。

**权限要求**: 需要登录

### 更新用户角色

**PUT** `/users/:id/roles`

更新指定用户的角色列表。

**权限要求**: 需要管理员权限

**请求体**:
```json
{
  "roles": ["admin", "editor"]
}
```

### 为用户分配角色

**POST** `/users/:id/roles`

为指定用户分配单个角色。

**权限要求**: 需要管理员权限

**请求体**:
```json
{
  "roleName": "editor"
}
```

### 移除用户角色

**DELETE** `/users/:id/roles/:roleName`

从指定用户移除角色。

**权限要求**: 需要管理员权限

### 获取用户角色名称

**GET** `/users/:id/roles/names`

获取指定用户的所有角色名称列表。

**权限要求**: 需要登录

## 角色管理接口

### 获取所有角色

**GET** `/roles`

获取系统中所有可用的角色。

**权限要求**: 需要登录

**响应**:
```json
[
  {
    "id": 1,
    "name": "admin",
    "permissions": [...],
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### 通过ID获取角色

**GET** `/roles/:id`

根据角色ID获取角色详细信息。

**权限要求**: 需要登录

### 创建新角色

**POST** `/roles`

创建新角色。

**权限要求**: 需要管理员权限

**请求体**:
```json
{
  "name": "editor"
}
```

### 更新角色

**PUT** `/roles/:id`

更新指定角色的信息。

**权限要求**: 需要管理员权限

### 删除角色

**DELETE** `/roles/:id`

删除指定的角色。

**权限要求**: 需要管理员权限

### 获取角色权限

**GET** `/roles/:id/permissions`

获取指定角色的所有权限。

**权限要求**: 需要登录

### 为用户分配角色（通过邮箱）

**POST** `/roles/assign-to-user`

通过邮箱为用户分配角色。

**权限要求**: 需要管理员权限

### 从用户移除角色（通过邮箱）

**DELETE** `/roles/remove-from-user`

通过邮箱从用户移除角色。

**权限要求**: 需要管理员权限

### 为角色分配权限

**POST** `/roles/:id/permissions`

为指定角色分配权限。

**权限要求**: 需要管理员权限

### 移除角色权限

**DELETE** `/roles/:id/permissions/:permissionId`

从指定角色移除权限。

**权限要求**: 需要管理员权限

### 获取角色用户

**GET** `/roles/:id/users`

获取拥有指定角色的所有用户。

**权限要求**: 需要登录

## 错误响应

所有API在出错时都会返回统一的错误格式：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

常见错误码：
- `400`: 请求参数错误
- `401`: 未授权访问
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突（如邮箱已存在）
- `500`: 服务器内部错误

## 权限系统

系统使用基于角色的访问控制(RBAC)，包含以下角色：

- **admin**: 管理员，拥有所有权限
- **editor**: 编辑者，可管理特定资源
- **viewer**: 查看者，只读访问权限

### 权限说明

| 动作 | 说明 |
|------|------|
| `create` | 创建资源 |
| `read` | 读取资源 |
| `update` | 更新资源 |
| `delete` | 删除资源 |
| `manage` | 管理资源（所有操作） |

### 资源类型

- **User**: 用户
- **Role**: 角色
- **Permission**: 权限
