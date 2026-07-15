// src/roles/dto/update-role.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ description: '角色名称', example: 'editor' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}