import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3500', // 允许的前端源
    credentials: true, // 允许携带凭据
  });
  app.setGlobalPrefix('api');

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('River Guard API')
    .setDescription('River Guard 用户认证与权限管理系统 API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '请输入 JWT token',
        in: 'header',
      },
      'JWT-auth', // 这个名称将在 @ApiBearerAuth() 装饰器中使用
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'CameraJWT',
        description: '请输入摄像头 JWT token',
        in: 'header',
      },
      'Camera-auth', // 摄像头 JWT 认证
    )
    .addTag('认证', '用户认证相关接口')
    .addTag('用户管理', '用户管理相关接口')
    .addTag('角色管理', '角色管理相关接口')
    .addTag('摄像头管理', '摄像头注册与管理相关接口')
    .addTag('事件管理', '事件上报与查询相关接口')
    .addTag('媒体管理', '媒体文件上传与管理相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持认证状态
      docExpansion: 'none', // 默认折叠所有接口
      filter: true, // 启用搜索过滤
      showRequestDuration: true, // 显示请求耗时
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`应用正在运行: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`API 文档地址: http://localhost:${process.env.PORT ?? 3000}/api-docs`);
}
bootstrap();
