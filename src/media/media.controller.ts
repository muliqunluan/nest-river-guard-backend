// src/media/media.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Res,
  HttpStatus,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { MediaService } from './media.service';
import { QueryMediaDto } from './dto/query-media.dto';
import { CameraJwtGuard } from '../cameras/guards/camera-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaType } from '../entities/media-file.entity';
import * as path from 'path';
import * as fs from 'fs';

// 允许的 MIME 类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/x-msvideo',
];

// 文件大小限制
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

@ApiTags('媒体管理')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ===== 上传媒体文件（Camera JWT） =====
  @Post('upload')
  @UseGuards(CameraJwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // 临时目录，实际路径在 service 中重新生成
          const tmpDir = './uploads/tmp';
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }
          cb(null, tmpDir);
        },
        filename: (req, file, cb) => {
          // 生成临时文件名，后续在 service 中重命名
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `tmp_${Date.now()}${ext}`);
        },
      }),
      limits: {
        fileSize: MAX_VIDEO_SIZE, // 使用较大的限制，具体限制按类型在逻辑中校验
      },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`不支持的文件类型: ${file.mimetype}`), false);
        }
      },
    }),
  )
  @ApiBearerAuth('Camera-auth')
  @ApiOperation({
    summary: '上传媒体文件',
    description: 'Jetson 上传图片或短视频文件（multipart/form-data）',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片或视频文件',
        },
        mediaType: {
          type: 'string',
          enum: ['image', 'video'],
          description: '媒体类型',
          example: 'image',
        },
        eventId: {
          type: 'number',
          description: '关联事件 ID（可选）',
          example: 1,
        },
        capturedAt: {
          type: 'string',
          format: 'date-time',
          description: '拍摄时间（可选，默认当前时间）',
          example: '2026-07-15T10:30:00.000Z',
        },
      },
      required: ['file', 'mediaType'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('mediaType') mediaType: string,
    @Body('eventId') eventId: string,
    @Body('capturedAt') capturedAt: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    if (!mediaType || !['image', 'video'].includes(mediaType)) {
      // 清理临时文件
      this.cleanupTempFile(file.path);
      throw new BadRequestException('mediaType 必须为 image 或 video');
    }

    const type = mediaType as MediaType;
    const cameraId = req.camera.cameraId;

    // 校验文件大小
    const maxSize = type === MediaType.IMAGE ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      this.cleanupTempFile(file.path);
      throw new BadRequestException(
        `文件大小超过限制: ${type === MediaType.IMAGE ? '5MB' : '50MB'}`,
      );
    }

    // 生成最终存储路径
    const fileName = this.mediaService.generateFileName(file.originalname);
    const finalPath = this.mediaService.generateStoragePath(type, cameraId, fileName);

    // 确保目录存在并移动文件
    this.mediaService.ensureDirectoryExists(finalPath);
    fs.renameSync(file.path, finalPath);

    // 解析 eventId
    const parsedEventId = eventId ? parseInt(eventId, 10) : undefined;
    const parsedCapturedAt = capturedAt ? new Date(capturedAt) : undefined;

    // 保存文件记录
    const savedFile = await this.mediaService.saveFileRecord(
      cameraId,
      {
        ...file,
        path: finalPath,
        filename: fileName,
      },
      type,
      parsedEventId,
      parsedCapturedAt,
    );

    return savedFile;
  }

  // ===== 为事件上传媒体文件（Camera JWT） =====
  @Post('event/:eventId')
  @UseGuards(CameraJwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tmpDir = './uploads/tmp';
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }
          cb(null, tmpDir);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `tmp_${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: MAX_VIDEO_SIZE },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`不支持的文件类型: ${file.mimetype}`), false);
        }
      },
    }),
  )
  @ApiBearerAuth('Camera-auth')
  @ApiOperation({
    summary: '为事件上传媒体',
    description: '为指定事件关联上传媒体文件',
  })
  @ApiParam({ name: 'eventId', description: '事件 ID', example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '图片或视频文件' },
        mediaType: { type: 'string', enum: ['image', 'video'], description: '媒体类型' },
        capturedAt: { type: 'string', format: 'date-time', description: '拍摄时间（可选）' },
      },
      required: ['file', 'mediaType'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async uploadForEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('mediaType') mediaType: string,
    @Body('capturedAt') capturedAt: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    if (!mediaType || !['image', 'video'].includes(mediaType)) {
      this.cleanupTempFile(file.path);
      throw new BadRequestException('mediaType 必须为 image 或 video');
    }

    const type = mediaType as MediaType;
    const cameraId = req.camera.cameraId;

    const maxSize = type === MediaType.IMAGE ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      this.cleanupTempFile(file.path);
      throw new BadRequestException(
        `文件大小超过限制: ${type === MediaType.IMAGE ? '5MB' : '50MB'}`,
      );
    }

    const fileName = this.mediaService.generateFileName(file.originalname);
    const finalPath = this.mediaService.generateStoragePath(type, cameraId, fileName);

    this.mediaService.ensureDirectoryExists(finalPath);
    fs.renameSync(file.path, finalPath);

    const parsedCapturedAt = capturedAt ? new Date(capturedAt) : undefined;

    const savedFile = await this.mediaService.saveFileForEvent(
      cameraId,
      eventId,
      { ...file, path: finalPath, filename: fileName },
      type,
      parsedCapturedAt,
    );

    return savedFile;
  }

  // ===== 查询媒体文件列表（用户 JWT） =====
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '查询媒体文件列表',
    description: '获取媒体文件列表，支持按摄像头、事件、媒体类型筛选及分页',
  })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: QueryMediaDto) {
    return this.mediaService.findAll(query);
  }

  // ===== 获取媒体文件二进制流（用户 JWT） =====
  @Get(':id/file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取媒体文件',
    description: '直接返回媒体文件的二进制内容，前端 <img> 或 <video> 标签可直接引用',
  })
  @ApiParam({ name: 'id', description: '媒体文件 ID', example: 1 })
  @ApiResponse({ status: 200, description: '文件内容' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async getFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const media = await this.mediaService.findOne(id);
    const filePath = this.mediaService.getFilePath(media);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('文件已丢失或不存在');
    }

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
    res.setHeader('Content-Length', media.fileSize);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  // ===== 根据事件 ID 获取关联媒体文件（用户 JWT） =====
  @Get('by-event/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '获取事件的媒体文件',
    description: '根据事件 ID 获取关联的所有媒体文件',
  })
  @ApiParam({ name: 'eventId', description: '事件 ID', example: 1 })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findByEventId(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.mediaService.findByEventId(eventId);
  }

  /**
   * 清理临时文件
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // 忽略清理错误
    }
  }
}
