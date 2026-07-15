// src/events/dto/create-event.dto.ts
import { IsString, IsEnum, IsOptional, IsObject, IsDateString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventSeverity } from '../../entities/event.entity';

export class CreateEventDto {
  @ApiProperty({
    description: '事件类型，如 garbage_detected, video_triggered, system_alert',
    example: 'garbage_detected',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type!: string;

  @ApiProperty({
    enum: EventSeverity,
    description: '严重级别',
    example: EventSeverity.WARNING,
  })
  @IsEnum(EventSeverity)
  severity!: EventSeverity;

  @ApiProperty({
    description: '事件描述',
    example: '检测到塑料瓶漂浮物',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '事件元数据（JSON 对象，可存储任意结构化数据）',
    example: { confidence: 0.87, garbageType: 'plastic_bottle' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: '事件发生时间（ISO 8601）',
    example: '2026-07-15T10:30:00.000Z',
  })
  @IsDateString()
  occurredAt!: string;
}
