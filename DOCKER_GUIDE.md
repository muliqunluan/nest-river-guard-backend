# Docker 部署指南

本文档介绍如何使用 Docker 部署 River Guard 后端服务。

## 前提条件

1. 安装 Docker Desktop（Windows/Mac）或 Docker Engine（Linux）
2. **确保 Docker Desktop 已启动并正在运行**
   - 在 Windows 上，检查系统托盘是否有 Docker 图标
   - 如果 Docker Desktop 未启动，请先启动它
3. 验证 Docker 安装：
   ```bash
   docker --version
   docker info
   ```

## 项目结构

```
river-guard/
├── Dockerfile              # 应用容器构建文件
├── docker-compose.yml      # 多容器编排文件
├── .dockerignore           # Docker 忽略文件
├── docker/
│   └── init-db.sql        # 数据库初始化脚本
└── src/
    └── scripts/
        ├── check-db.ts    # 数据库检查脚本
        └── init-test-data.ts  # 测试数据初始化脚本
```

## 快速开始

### 1. 克隆项目并进入目录

```bash
git clone <repository-url>
cd river-guard
```

### 2. 配置环境变量（可选）

创建 `.env` 文件或修改现有的 `.env` 文件：

```env
PORT=7050
PG_USERNAME=postgres
PG_PASSWORD=12100
DB_NAME=river_guard
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 3. 启动服务

使用 docker-compose 启动所有服务：

```bash
# 构建并启动所有服务
docker-compose up --build

# 或者在后台运行
docker-compose up --build -d
```

### 4. 验证服务

1. **检查服务状态**：
   ```bash
   docker-compose ps
   ```

2. **查看应用日志**：
   ```bash
   docker-compose logs app
   ```

3. **查看数据库日志**：
   ```bash
   docker-compose logs postgres
   ```

4. **测试 API**：
   访问 `http://localhost:7050/api` 或使用 curl：
   ```bash
   curl http://localhost:7050/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"admin123"}'
   ```

## 服务说明

### 应用服务 (app)

- **基础镜像**：`node:20-alpine`
- **端口**：容器内 3000，主机 7050
- **环境变量**：从 `.env` 文件读取

### 数据库服务 (postgres)

- **基础镜像**：`postgres:15-alpine`
- **端口**：容器内和主机均为 5432
- **数据持久化**：使用 Docker 卷 `postgres_data`
- **初始化脚本**：`docker/init-db.sql`

## 数据库初始化

数据库初始化分为两个阶段：

1. **容器启动时**：执行 `docker/init-db.sql` 创建表结构和基础数据
2. **应用启动后**：执行 `src/scripts/init-test-data.ts` 创建测试用户和角色

### 测试账户

初始化完成后，系统会创建以下测试账户：

- **管理员**：admin@test.com / admin123
- **编辑者**：editor@test.com / editor123
- **查看者**：viewer@test.com / viewer123
- **多角色**：multi@test.com / multi123

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up --build --force-recreate
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs app
docker-compose logs postgres

# 实时跟踪日志
docker-compose logs -f app
```

### 数据库操作

```bash
# 连接到数据库容器
docker-compose exec postgres psql -U postgres -d river_guard

# 备份数据库
docker-compose exec postgres pg_dump -U postgres river_guard > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres river_guard < backup.sql
```

## 生产环境部署

### 1. 环境变量配置

生产环境中，请确保：

- 修改 `JWT_SECRET` 为强密码
- 修改数据库密码
- 设置 `NODE_ENV=production`

### 2. 数据安全

- 使用 Docker 卷或绑定挂载持久化数据
- 定期备份数据库
- 限制数据库端口的外部访问

## 故障排除

### 常见问题

1. **Docker 连接错误**：
   ```
   error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/...": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
   ```
   **解决方案**：
   - 确保 Docker Desktop 已启动（检查系统托盘图标）
   - 重启 Docker Desktop

2. **端口冲突**：
   - 修改 `docker-compose.yml` 中的端口映射
   - 或停止占用端口的其他服务

3. **数据库连接失败**：
   - 检查数据库服务是否正常启动
   - 验证环境变量配置
   - 查看数据库日志

## 清理

如需完全清理 Docker 资源：

```bash
# 停止并删除容器
docker-compose down

# 删除相关卷（谨慎操作，会删除数据）
docker-compose down -v

# 删除相关镜像
docker-compose down --rmi all
```
