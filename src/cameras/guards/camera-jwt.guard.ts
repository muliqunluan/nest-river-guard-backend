// src/cameras/guards/camera-jwt.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CameraJwtPayload } from '../interfaces/camera-jwt-payload';

@Injectable()
export class CameraJwtGuard implements CanActivate {
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
      const payload = this.jwtService.verify<CameraJwtPayload>(token);

      // 验证是否为摄像头类型的 JWT
      if (payload.type !== 'camera') {
        throw new UnauthorizedException('无效的摄像头令牌');
      }

      // 将摄像头信息附加到请求对象
      request.camera = {
        deviceId: payload.sub,
        cameraId: payload.cameraId,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('摄像头令牌无效或已过期');
    }
  }
}
