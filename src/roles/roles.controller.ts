// src/roles/roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../permissions/guards/policies.guard';
import { CheckPolicies, Policies } from '../permissions/decorators/policies.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignRoleToUserDto } from './dto/assign-role-to-user.dto';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // 获取所有角色 - 任何登录用户可读
  @Get()
  @ApiOperation({ summary: '获取所有角色', description: '获取系统中所有可用的角色' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async findAll() {
    return this.rolesService.findAll();
  }

  // 通过ID获取角色 - 任何登录用户可读
  @Get(':id')
  @ApiOperation({ summary: '通过ID获取角色', description: '根据角色ID获取角色详细信息' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async findById(@Param('id') id: string) {
    return this.rolesService.findById(parseInt(id, 10));
  }

  // 通过邮箱为用户分配角色 - 仅管理员
  // ⚠️ 具体路由必须放在参数化路由(:id)之前，避免路由冲突
  @Post('assign-to-user')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('users'))
  @ApiOperation({ summary: '为用户分配角色', description: '通过邮箱为用户分配角色（需要管理员权限）' })
  @ApiBody({ type: AssignRoleToUserDto })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  async assignRoleToUser(@Body() assignRoleToUserDto: AssignRoleToUserDto) {
    return this.rolesService.assignRoleToUserByEmail(
      assignRoleToUserDto.email,
      assignRoleToUserDto.roleName,
    );
  }

  // 通过邮箱从用户移除角色 - 仅管理员
  // ⚠️ 具体路由必须放在参数化路由(:id)之前，避免路由冲突
  @Delete('remove-from-user')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('users'))
  @ApiOperation({ summary: '从用户移除角色', description: '通过邮箱从用户移除角色（需要管理员权限）' })
  @ApiQuery({ name: 'email', description: '用户邮箱', example: 'user@example.com' })
  @ApiQuery({ name: 'roleName', description: '角色名称', example: 'admin' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  async removeRoleFromUser(@Query() query: { email: string; roleName: string }) {
    return this.rolesService.removeRoleFromUserByEmail(query.email, query.roleName);
  }

  // 创建新角色 - 仅管理员
  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('roles'))
  @ApiOperation({ summary: '创建新角色', description: '创建新角色（需要管理员权限）' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 409, description: '角色已存在' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto.name);
  }

  // 更新角色 - 仅管理员
  @Put(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('roles'))
  @ApiOperation({ summary: '更新角色', description: '更新指定角色的信息（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(parseInt(id, 10), updateRoleDto.name);
  }

  // 删除角色 - 仅管理员
  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('roles'))
  @ApiOperation({ summary: '删除角色', description: '删除指定的角色（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(parseInt(id, 10));
    return { message: 'Role deleted successfully' };
  }

  // 获取角色的所有权限 - 任何登录用户可读
  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限', description: '获取指定角色的所有权限' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(parseInt(id, 10));
  }

  // 为角色分配权限 - 仅管理员
  @Post(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('permissions'))
  @ApiOperation({ summary: '为角色分配权限', description: '为指定角色分配权限（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiBody({ type: AssignPermissionDto })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '角色或权限不存在' })
  async assignPermission(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermissionToRole(
      parseInt(id, 10),
      assignPermissionDto.permissionId,
    );
  }

  // 从角色移除权限 - 仅管理员
  @Delete(':id/permissions/:permissionId')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('permissions'))
  @ApiOperation({ summary: '移除角色权限', description: '从指定角色移除权限（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiParam({ name: 'permissionId', description: '权限ID', example: '1' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '角色或权限不存在' })
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermissionFromRole(
      parseInt(id, 10),
      parseInt(permissionId, 10),
    );
  }

  // 获取拥有指定角色的所有用户 - 任何登录用户可读
  @Get(':id/users')
  @ApiOperation({ summary: '获取角色用户', description: '获取拥有指定角色的所有用户' })
  @ApiParam({ name: 'id', description: '角色ID', example: '1' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  async getUsersWithRole(@Param('id') id: string) {
    return this.rolesService.getUsersWithRole(parseInt(id, 10));
  }
}