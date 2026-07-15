// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from '../entities/event.entity';
import { CameraJwtGuard } from '../cameras/guards/camera-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
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
  controllers: [EventsController],
  providers: [EventsService, CameraJwtGuard],
  exports: [EventsService],
})
export class EventsModule {}
