// src/roles/dto/assign-permission.dto.ts
import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionDto {
  @ApiProperty({ description: '权限ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  permissionId!: number;
}