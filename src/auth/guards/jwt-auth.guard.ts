// src/auth/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('缺少认证令牌');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('认证令牌格式错误');
    }

    try {
      const payload = this.jwtService.verify(token);
      // 将 JWT payload 标准化：从 sub 映射出 id，同时保留原始 payload
      request.user = { ...payload, id: payload.sub, userId: payload.sub };
      return true;
    } catch (error) {
      console.error('JWT验证失败:', error);
      throw new UnauthorizedException('认证令牌无效或已过期');
    }
  }
}