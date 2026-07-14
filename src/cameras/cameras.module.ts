// src/cameras/cameras.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CamerasController } from './cameras.controller';
import { CamerasService } from './cameras.service';
import { Camera } from '../entities/camera.entity';
import { CameraJwtGuard } from './guards/camera-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Camera]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CamerasController],
  providers: [CamerasService, CameraJwtGuard],
  exports: [CamerasService],
})
export class CamerasModule {}
