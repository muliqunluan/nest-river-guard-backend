// src/roles/dto/create-role.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: 'editor' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}