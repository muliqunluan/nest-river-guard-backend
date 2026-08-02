// src/permissions/permissions.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from './guards/policies.guard';
import { CheckPolicies, Policies } from './decorators/policies.decorator';

@ApiTags('权限管理')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // 获取所有权限 - 仅管理员
  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('permissions'))
  @ApiOperation({ summary: '获取所有权限', description: '获取系统中所有可用的权限（需要管理员权限）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async findAll() {
    return this.permissionsService.findAll();
  }
}
