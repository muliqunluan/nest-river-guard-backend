// src/auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册', description: '注册新用户并返回访问令牌' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com', description: '用户邮箱' },
        password: { type: 'string', example: 'password123', description: '用户密码' },
        first_name: { type: 'string', example: '张', description: '名' },
        last_name: { type: 'string', example: '三', description: '姓' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: '注册成功', schema: { example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '邮箱已存在' })
  async register(@Body() body: { email: string; password: string; first_name?: string; last_name?: string }) {
    return this.authService.register(body.email, body.password, body.first_name, body.last_name);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录', description: '用户登录并返回访问令牌' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com', description: '用户邮箱' },
        password: { type: 'string', example: 'password123', description: '用户密码' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({ status: 200, description: '登录成功', schema: { example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } })
  @ApiResponse({ status: 401, description: '认证失败' })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async getCurrentUser(@Request() req) {
    return this.authService.getUserById(req.user.sub);
  }
}
