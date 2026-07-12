// src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../permissions/guards/policies.guard';
import { CheckPolicies, Policies } from '../permissions/decorators/policies.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@ApiTags('用户管理')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取当前用户信息 - 仅需登录
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.sub);
  }

  // 通过ID获取用户信息 - 仅需登录
  @Get(':id')
  @ApiOperation({ summary: '通过ID获取用户信息', description: '根据用户ID获取用户详细信息' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserById(@Param('id') id: string) {
    return this.userService.findById(parseInt(id, 10));
  }

  // 通过邮箱获取用户信息 - 仅需登录
  @Get('email/:email')
  @ApiOperation({ summary: '通过邮箱获取用户信息', description: '根据用户邮箱获取用户详细信息' })
  @ApiParam({ name: 'email', description: '用户邮箱', example: 'user@example.com' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  // 创建新用户
  @Post()
  @ApiOperation({ summary: '创建新用户', description: '创建新用户（待实现）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return { message: 'User creation endpoint - to be implemented with AuthService' };
  }

  // 更新用户信息 - 仅管理员
  @Put(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('admin-panel'))
  @ApiOperation({ summary: '更新用户信息', description: '更新指定用户的信息（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return { message: 'User update endpoint - to be implemented' };
  }

  // 更新用户角色 - 仅管理员
  @Put(':id/roles')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('admin-panel'))
  @ApiOperation({ summary: '更新用户角色', description: '更新指定用户的角色列表（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roles: { type: 'array', items: { type: 'string' }, example: ['admin', 'editor'] },
      },
      required: ['roles'],
    },
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async updateUserRoles(@Param('id') id: string, @Body() body: { roles: string[] }) {
    const user = await this.userService.findById(parseInt(id, 10));
    return this.userService.updateUserRoles(user.email, body.roles);
  }

  // 为用户分配单个角色 - 仅管理员
  @Post(':id/roles')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('admin-panel'))
  @ApiOperation({ summary: '为用户分配角色', description: '为指定用户分配单个角色（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  async assignRole(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
    const user = await this.userService.findById(parseInt(id, 10));
    return this.userService.assignRoleToUser(user.email, assignRoleDto.roleName);
  }

  // 从用户移除角色 - 仅管理员
  @Delete(':id/roles/:roleName')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(Policies.canManage('admin-panel'))
  @ApiOperation({ summary: '移除用户角色', description: '从指定用户移除角色（需要管理员权限）' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiParam({ name: 'roleName', description: '角色名称', example: 'admin' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户或角色不存在' })
  async removeRole(@Param('id') id: string, @Param('roleName') roleName: string) {
    const user = await this.userService.findById(parseInt(id, 10));
    return this.userService.removeRoleFromUser(user.email, roleName);
  }

  // 获取用户的所有角色名称 - 仅需登录
  @Get(':id/roles/names')
  @ApiOperation({ summary: '获取用户角色名称', description: '获取指定用户的所有角色名称' })
  @ApiParam({ name: 'id', description: '用户ID', example: '1' })
  @ApiResponse({ status: 200, description: '获取成功', schema: { example: ['admin', 'editor'] } })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserRoleNames(@Param('id') id: string) {
    return this.userService.getUserRoleNames(parseInt(id, 10));
  }
}
