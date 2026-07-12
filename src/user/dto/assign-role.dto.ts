// src/user/dto/assign-role.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ description: '角色名称', example: 'editor' })
  @IsString()
  @IsNotEmpty()
  roleName!: string;
}