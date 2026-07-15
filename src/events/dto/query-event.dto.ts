// src/events/dto/query-event.dto.ts
import { IsOptional, IsString, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryEventDto {
  @ApiProperty({
    description: '按摄像头 ID 筛选',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cameraId?: number;

  @ApiProperty({
    description: '按事件类型筛选',
    required: false,
    example: 'garbage_detected',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: '按严重级别筛选',
    required: false,
    example: 'warning',
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({
    description: '按处理状态筛选',
    required: false,
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: '开始时间',
    required: false,
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({
    description: '结束时间',
    required: false,
    example: '2026-07-15T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({
    description: '页码',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '每页条数',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
