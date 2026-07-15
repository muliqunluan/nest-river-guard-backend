-- PostgreSQL 数据库初始化脚本
-- 这个脚本会在 PostgreSQL 容器首次启动时自动执行

-- 创建数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS "user" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT true,
    "roles" TEXT[] DEFAULT ARRAY['viewer'],
    "is_protected" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色表（如果不存在）
CREATE TABLE IF NOT EXISTS "role" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(50) UNIQUE NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建权限表（如果不存在）
CREATE TABLE IF NOT EXISTS "permission" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色权限关联表（如果不存在）
CREATE TABLE IF NOT EXISTS "role_permission" (
    "id" SERIAL PRIMARY KEY,
    "role_id" INTEGER REFERENCES "role"("id") ON DELETE CASCADE,
    "permission_id" INTEGER REFERENCES "permission"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- 创建 camera 表（如果不存在）
CREATE TABLE IF NOT EXISTS "camera" (
    "id" SERIAL PRIMARY KEY,
    "deviceId" VARCHAR(255) UNIQUE NOT NULL,
    "accessToken" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" VARCHAR(20) DEFAULT 'offline',
    "lastSeenAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 event 表（如果不存在）
CREATE TABLE IF NOT EXISTS "event" (
    "id" SERIAL PRIMARY KEY,
    "cameraId" INTEGER NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20) DEFAULT 'info',
    "status" VARCHAR(20) DEFAULT 'pending',
    "description" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 media_file 表（如果不存在）
CREATE TABLE IF NOT EXISTS "media_file" (
    "id" SERIAL PRIMARY KEY,
    "cameraId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "mediaType" VARCHAR(20) NOT NULL,
    "filePath" VARCHAR(500) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user"("email");
CREATE INDEX IF NOT EXISTS "idx_user_roles" ON "user" USING GIN("roles");
CREATE INDEX IF NOT EXISTS "idx_role_name" ON "role"("name");
CREATE INDEX IF NOT EXISTS "idx_permission_name" ON "permission"("name");
CREATE INDEX IF NOT EXISTS "idx_camera_deviceId" ON "camera"("deviceId");
CREATE INDEX IF NOT EXISTS "idx_camera_status" ON "camera"("status");
CREATE INDEX IF NOT EXISTS "idx_event_cameraId" ON "event"("cameraId");
CREATE INDEX IF NOT EXISTS "idx_event_type" ON "event"("type");
CREATE INDEX IF NOT EXISTS "idx_event_occurredAt" ON "event"("occurredAt");
CREATE INDEX IF NOT EXISTS "idx_event_status" ON "event"("status");
CREATE INDEX IF NOT EXISTS "idx_media_file_cameraId" ON "media_file"("cameraId");
CREATE INDEX IF NOT EXISTS "idx_media_file_eventId" ON "media_file"("eventId");

-- 插入默认角色
INSERT INTO "role" ("name") VALUES 
    ('admin'),
    ('editor'),
    ('viewer')
ON CONFLICT ("name") DO NOTHING;

-- 插入默认权限
INSERT INTO "permission" ("name", "action", "resource") VALUES 
    ('manage-users', 'manage', 'users'),
    ('manage-roles', 'manage', 'roles'),
    ('manage-permissions', 'manage', 'permissions')
ON CONFLICT ("name") DO NOTHING;

-- 为角色分配权限
-- 管理员拥有所有权限
INSERT INTO "role_permission" ("role_id", "permission_id")
SELECT r.id, p.id 
FROM "role" r, "permission" p 
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表添加更新时间触发器
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON "role" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_updated_at BEFORE UPDATE ON "permission" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- camera 表使用 TypeORM 的 @UpdateDateColumn 自动管理 updatedAt，无需触发器

-- 插入种子用户数据
-- 密码 admin123 对应的 bcrypt hash
INSERT INTO "user" ("email", "password_hash", "first_name", "last_name", "is_active", "roles", "is_protected")
VALUES
    ('admin@test.com', '$2b$10$Tx5TP6jPyUL1j3ty83KUOursXgoB.ICrT6Ds3AOUKBB5ci.3rvpzW', 'Admin', 'User', true, ARRAY['admin'], true),
    ('user@test.com', '$2b$10$Tx5TP6jPyUL1j3ty83KUOursXgoB.ICrT6Ds3AOUKBB5ci.3rvpzW', 'User', 'One', true, ARRAY['viewer'], false)
ON CONFLICT ("email") DO NOTHING;
