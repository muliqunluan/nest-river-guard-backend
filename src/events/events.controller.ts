// src/events/events.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  ParseIntPipe,
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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { CameraJwtGuard } from '../cameras/guards/camera-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('事件管理')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ===== 摄像头上报事件（Camera JWT） =====
  @Post()
  @UseGuards(CameraJwtGuard)
  @ApiBearerAuth('Camera-auth')
  @ApiOperation({
    summary: '上报事件',
    description: 'Jetson 上报各类监测事件（垃圾检测、异常告警等），通过 type 字段区分事件类型',
  })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: '事件创建成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Body() dto: CreateEventDto, @Request() req) {
    return this.eventsService.create(req.camera.cameraId, dto);
  }

  // ===== 查询事件列表（用户 JWT） =====
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '查询事件列表',
    description: '获取事件列表，支持按摄像头、类型、严重级别、状态、时间范围筛选及分页',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  // ===== 获取事件详情（用户 JWT） =====
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取事件详情',
    description: '根据事件 ID 获取详细信息',
  })
  @ApiParam({ name: 'id', description: '事件 ID', example: 1 })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '事件不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  // ===== 更新事件（用户 JWT） =====
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '更新事件',
    description: '更新事件的处理状态、严重级别或描述（如确认/解决事件）',
  })
  @ApiParam({ name: 'id', description: '事件 ID', example: 1 })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '事件不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }
}
