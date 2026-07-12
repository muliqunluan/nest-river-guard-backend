// src/user/dto/create-user.dto.ts
import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '用户邮箱', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: '用户密码', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ description: '名', example: '张' })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiPropertyOptional({ description: '姓', example: '三' })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiPropertyOptional({ description: '角色列表', example: ['viewer'], type: [String] })
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];
}