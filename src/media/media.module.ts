// src/media/media.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaFile } from '../entities/media-file.entity';
import { CameraJwtGuard } from '../cameras/guards/camera-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaFile]),
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
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
  controllers: [MediaController],
  providers: [MediaService, CameraJwtGuard],
  exports: [MediaService],
})
export class MediaModule {}
