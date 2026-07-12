# 使用官方 Node.js 20 LTS 镜像作为基础镜像
FROM node:20-alpine

# 使用国内镜像源并安装必要的系统依赖（Alpine 无 bash 需要额外安装）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk update && \
    apk add --no-cache curl bash && \
    curl -fsSL https://bun.sh/install | bash && \
    cp /root/.bun/bin/bun /usr/local/bin/bun

# 验证 Bun 是否安装成功
RUN bun --version

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 bun.lock
COPY package.json bun.lock ./

# 安装所有依赖（包括开发依赖，因为需要构建）
RUN bun install

# 复制源代码
COPY . .

# 构建应用
RUN bun run build

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 更改文件所有权
RUN chown -R nestjs:nodejs /app
USER nestjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["bun", "run", "start:prod"]
