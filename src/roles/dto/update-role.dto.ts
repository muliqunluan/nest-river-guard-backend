// src/roles/dto/update-role.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}