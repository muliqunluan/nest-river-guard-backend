// src/auth/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface JwtUserPayload {
  email: string;
  sub: number;
  roles: string[];
}

interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload & { userId: number };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    try {
      const payload = await this.jwtService.verifyAsync<JwtUserPayload>(token);
      request.user = { ...payload, userId: payload.sub };
      return true;
    } catch (error) {
      throw new UnauthorizedException(this.resolveErrorMessage(error));
    }
  }

  private extractToken(request: AuthenticatedRequest): string {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('缺少认证令牌');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('认证令牌格式错误');
    }
    return token;
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      switch (error.name) {
        case 'TokenExpiredError':
          return '认证令牌已过期';
        case 'JsonWebTokenError':
          return '认证令牌无效';
        case 'NotBeforeError':
          return '认证令牌尚未生效';
      }
    }
    return '认证令牌无效或已过期';
  }
}
