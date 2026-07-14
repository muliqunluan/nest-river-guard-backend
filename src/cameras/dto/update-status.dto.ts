// src/cameras/dto/update-status.dto.ts
import { IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CameraStatus } from '../../entities/camera.entity';

export class UpdateStatusDto {
  @ApiProperty({ description: '纬度', example: 41.3023456 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty({ description: '经度', example: 113.9845678 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiProperty({ enum: CameraStatus, description: '在线状态', example: 'online' })
  @IsEnum(CameraStatus)
  status!: CameraStatus;
}
