// src/media/media.service.ts
import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaFile, MediaType } from '../entities/media-file.entity';
import { QueryMediaDto } from './dto/query-media.dto';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

/**
 * 上传文件信息接口（替代 Express.Multer.File，避免类型依赖）
 */
export interface UploadedFileInfo {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
  filename: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(MediaFile)
    private mediaRepo: Repository<MediaFile>,
    private configService: ConfigService,
  ) {}

  /**
   * 获取上传目录路径
   */
  getUploadDirectory(): string {
    return this.configService.get<string>('upload.directory') || './uploads';
  }

  /**
   * 保存上传的媒体文件记录
   */
  async saveFileRecord(
    cameraId: number,
    file: UploadedFileInfo,
    mediaType: MediaType,
    eventId?: number,
    capturedAt?: Date,
  ) {
    const record = this.mediaRepo.create({
      cameraId,
      eventId: eventId ?? null,
      mediaType,
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      capturedAt: capturedAt ?? new Date(),
    });

    return this.mediaRepo.save(record);
  }

  /**
   * 为指定事件上传媒体文件
   */
  async saveFileForEvent(
    cameraId: number,
    eventId: number,
    file: UploadedFileInfo,
    mediaType: MediaType,
    capturedAt?: Date,
  ) {
    return this.saveFileRecord(cameraId, file, mediaType, eventId, capturedAt);
  }

  /**
   * 生成唯一的文件名
   */
  generateFileName(originalName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const uuid = randomUUID().slice(0, 8);
    const ext = path.extname(originalName) || '.jpg';
    return `${timestamp}_${uuid}${ext}`;
  }

  /**
   * 生成存储路径（按类型/设备ID/日期分目录）
   */
  generateStoragePath(mediaType: MediaType, cameraId: number, fileName: string): string {
    const uploadDir = this.getUploadDirectory();
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const typeDir = mediaType === MediaType.IMAGE ? 'images' : 'videos';

    return path.join(uploadDir, typeDir, String(cameraId), year, month, fileName);
  }

  /**
   * 确保目录存在
   */
  ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 查询媒体文件列表
   */
  async findAll(query: QueryMediaDto) {
    const qb = this.mediaRepo.createQueryBuilder('media');

    if (query.cameraId) {
      qb.andWhere('media.cameraId = :cameraId', { cameraId: query.cameraId });
    }
    if (query.eventId) {
      qb.andWhere('media.eventId = :eventId', { eventId: query.eventId });
    }
    if (query.mediaType) {
      qb.andWhere('media.mediaType = :mediaType', { mediaType: query.mediaType });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.orderBy('media.capturedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取媒体文件信息
   */
  async findOne(id: number) {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException('媒体文件不存在');
    }
    return media;
  }

  /**
   * 获取媒体文件的物理路径
   */
  getFilePath(media: MediaFile): string {
    return path.resolve(media.filePath);
  }

  /**
   * 根据事件 ID 查询关联的媒体文件
   */
  async findByEventId(eventId: number) {
    return this.mediaRepo.find({
      where: { eventId },
      order: { capturedAt: 'ASC' },
    });
  }
}
