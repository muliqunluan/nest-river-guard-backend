nginx 配置文件编辑
sudo vim /etc/nginx/sites-available/river-guard
nginx 重启服务
sudo nginx -t && sudo systemctl restart nginx

查看 docker 中运行中的容器
docker ps

停止并删除旧容器，重新构建并启动
docker compose up -d --build

停止所有容器并删除
docker compose down