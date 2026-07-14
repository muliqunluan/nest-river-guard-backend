// src/cameras/cameras.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CamerasService } from './cameras.service';
import { RegisterCameraDto } from './dto/register-camera.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CameraJwtGuard } from './guards/camera-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../permissions/guards/policies.guard';
import { CheckPolicies, Policies } from '../permissions/decorators/policies.decorator';

@ApiTags('摄像头管理')
@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  // ===== 摄像头注册（无需认证，通过 KEY 验证） =====
  @Post('register')
  @ApiOperation({
    summary: '摄像头注册',
    description: 'Jetson 通过 DEVICE_ID 和 KEY 完成注册，返回 AccessToken',
  })
  @ApiBody({ type: RegisterCameraDto })
  @ApiResponse({ status: 201, description: '注册成功', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIs...' } } })
  @ApiResponse({ status: 401, description: '密钥无效' })
  async register(@Body() dto: RegisterCameraDto) {
    return this.camerasService.register(dto.deviceId, dto.key);
  }

  // ===== 状态上报（需要摄像头 JWT） =====
  @Post(':id/status')
  @UseGuards(CameraJwtGuard)
  @ApiBearerAuth('Camera-auth')
  @ApiOperation({
    summary: '位置与状态上报',
    description: 'Jetson 定时上报位置及状态，服务器更新 lastSeenAt、坐标、状态等字段',
  })
  @ApiParam({ name: 'id', description: '摄像头 ID', example: '1' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: '状态更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '摄像头不存在' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.camerasService.updateStatus(
      req.camera.deviceId,
      dto.lat,
      dto.lng,
      dto.status,
    );
  }

  // ===== 获取摄像头列表（需要用户 JWT） =====
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取摄像头列表',
    description: '获取所有摄像头数据，支持按条件筛选',
  })
  @ApiQuery({
    name: 'condition',
    required: false,
    description: '筛选条件（如按状态过滤）',
    example: 'online',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  async findAll(@Query('condition') condition?: string) {
    return this.camerasService.findAll(condition);
  }

  // ===== 删除摄像头（仅测试环境，需要管理员权限） =====
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(Policies.canManage('admin-panel'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '删除摄像头',
    description: '删除摄像头记录（仅测试环境可用，需要管理员权限）',
  })
  @ApiParam({ name: 'id', description: '摄像头 ID', example: '1' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权访问' })
  @ApiResponse({ status: 403, description: '权限不足或生产环境不允许删除' })
  @ApiResponse({ status: 404, description: '摄像头不存在' })
  async remove(@Param('id') id: string) {
    await this.camerasService.remove(parseInt(id, 10));
  }
}
