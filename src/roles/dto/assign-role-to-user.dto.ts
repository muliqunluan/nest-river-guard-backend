// src/roles/dto/assign-role-to-user.dto.ts
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleToUserDto {
  @ApiProperty({ description: '用户邮箱', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: '角色名称', example: 'editor' })
  @IsString()
  @IsNotEmpty()
  roleName!: string;
}