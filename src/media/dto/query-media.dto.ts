// src/media/dto/query-media.dto.ts
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryMediaDto {
  @ApiProperty({
    description: '按摄像头 ID 筛选',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cameraId?: number;

  @ApiProperty({
    description: '按关联事件 ID 筛选',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  eventId?: number;

  @ApiProperty({
    description: '按媒体类型筛选（image / video）',
    required: false,
  })
  @IsOptional()
  @IsString()
  mediaType?: string;

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
