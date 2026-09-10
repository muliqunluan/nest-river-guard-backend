# ============ 构建阶段 ============
# 使用官方 Node.js 20 LTS 镜像作为基础镜像
FROM node:20-alpine AS builder

# 使用国内镜像源并安装必要依赖 + Bun（构建需要 devDependencies 与 Bun）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache curl bash && \
    curl -fsSL https://bun.sh/install | bash && \
    cp /root/.bun/bin/bun /usr/local/bin/bun

# 验证 Bun 是否安装成功
RUN bun --version

WORKDIR /app

# 先复制依赖清单，安装全部依赖（含 devDependencies，因为需要构建）
COPY package.json bun.lock ./
RUN bun install

# 复制源代码并构建
COPY . .
RUN bun run build

# 在独立目录安装生产依赖（仅运行所需，减小运行镜像体积与文件数量）
WORKDIR /prod
COPY package.json bun.lock ./
RUN bun install --production

# ============ 运行阶段 ============
FROM node:20-alpine

# 安装 curl 供健康检查使用
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# 预先创建上传目录并赋予 nestjs 属主，确保命名卷首次挂载时权限正确
RUN mkdir -p uploads && chown nestjs:nodejs uploads

# 直接以 nestjs:nodejs 属主复制，避免单独的 chown -R 触发 overlay2 copy-up
COPY --chown=nestjs:nodejs --from=builder /prod/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

USER nestjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]
