// src/cameras/dto/register-camera.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCameraDto {
  @ApiProperty({ description: 'Jetson 处理器序列号', example: 'jetson-serial-001' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({ description: '与服务器共享的密钥', example: 'your-shared-key' })
  @IsString()
  @IsNotEmpty()
  key!: string;
}
