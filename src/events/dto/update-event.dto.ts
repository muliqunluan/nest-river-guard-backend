// src/events/dto/update-event.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, EventSeverity } from '../../entities/event.entity';

export class UpdateEventDto {
  @ApiProperty({
    enum: EventStatus,
    description: '处理状态',
    example: EventStatus.RESOLVED,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({
    enum: EventSeverity,
    description: '严重级别',
    required: false,
  })
  @IsOptional()
  @IsEnum(EventSeverity)
  severity?: EventSeverity;

  @ApiProperty({
    description: '事件描述',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
