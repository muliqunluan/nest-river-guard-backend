// src/cameras/cameras.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  OnApplicationBootstrap,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Camera, CameraStatus } from '../entities/camera.entity';
import { CameraJwtPayload } from './interfaces/camera-jwt-payload';

/**
 * 摄像头离线超时时间（毫秒）
 * 默认 30 秒，可通过环境变量 CAMERA_OFFLINE_TIMEOUT 配置
 */
const DEFAULT_OFFLINE_TIMEOUT_MS = 30_000;

/**
 * 离线检测定时器间隔（毫秒）
 * 每 15 秒检查一次
 */
const OFFLINE_CHECK_INTERVAL_MS = 15_000;

@Injectable()
export class CamerasService implements OnApplicationBootstrap, OnModuleDestroy {
  private offlineCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly logger = new Logger(CamerasService.name);

  constructor(
    @InjectRepository(Camera)
    private cameraRepo: Repository<Camera>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  /**
   * 应用启动后初始化离线检测定时任务
   * 等待数据库连接建立后再执行检查
   */
  async onApplicationBootstrap() {
    // 等待数据库连接建立
    await this.waitForDatabaseConnection();
    
    // 数据库连接就绪后，立即执行一次检查
    await this.checkOfflineCameras();

    // 定时执行离线检查
    this.offlineCheckTimer = setInterval(() => {
      this.checkOfflineCameras();
    }, OFFLINE_CHECK_INTERVAL_MS);
    
    this.logger.log('离线检测定时任务已启动');
  }

  /**
   * 等待数据库连接建立
   */
  private async waitForDatabaseConnection(maxRetries = 10, retryInterval = 1000): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (this.dataSource.isInitialized) {
          // 测试连接是否真的可用
          await this.dataSource.query('SELECT 1');
          this.logger.log('数据库连接已建立');
          return;
        }
      } catch (error) {
        this.logger.warn(`数据库连接未就绪，重试 ${i + 1}/${maxRetries}...`);
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    
    throw new Error('数据库连接建立超时，请检查数据库配置');
  }

  /**
   * 模块销毁时清理定时器
   */
  onModuleDestroy() {
    if (this.offlineCheckTimer) {
      clearInterval(this.offlineCheckTimer);
      this.offlineCheckTimer = null;
      this.logger.log('离线检测定时任务已停止');
    }
  }

  /**
   * 检查所有在线摄像头，若 lastSeenAt 超过超时阈值则自动标记为离线
   */
  async checkOfflineCameras(): Promise<number> {
    try {
      // 确保数据库连接可用
      if (!this.dataSource.isInitialized) {
        this.logger.warn('数据库连接未就绪，跳过离线检测');
        return 0;
      }

      const timeoutMs =
        this.configService.get<number>('cameraOfflineTimeout') ?? DEFAULT_OFFLINE_TIMEOUT_MS;
      const cutoffTime = new Date(Date.now() - timeoutMs);

      const result = await this.cameraRepo
        .createQueryBuilder()
        .update(Camera)
        .set({ status: CameraStatus.OFFLINE })
        .where('status = :onlineStatus', { onlineStatus: CameraStatus.ONLINE })
        .andWhere('"lastSeenAt" IS NOT NULL')
        .andWhere('"lastSeenAt" < :cutoffTime', { cutoffTime })
        .execute();

      const affectedCount = result.affected ?? 0;
      if (affectedCount > 0) {
        this.logger.log(
          `离线检测：已将 ${affectedCount} 个摄像头标记为离线（超时阈值 ${timeoutMs / 1000} 秒）`,
        );
      }
      return affectedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('离线检测失败:', errorMessage);
      return 0;
    }
  }

  /**
   * 摄像头注册
   * 验证 KEY，创建或更新摄像头记录，返回 AccessToken
   */
  async register(deviceId: string, key: string) {
    // 校验 KEY
    const expectedKey = this.configService.get<string>('KEY');
    if (!expectedKey || key !== expectedKey) {
      throw new UnauthorizedException('密钥无效');
    }

    // 查找是否已注册
    const existing = await this.cameraRepo.findOne({ where: { deviceId } });

    // 生成摄像头 JWT（新摄像头先保存以获取 ID）
    if (existing) {
      const payload: CameraJwtPayload = {
        sub: deviceId,
        type: 'camera',
        cameraId: existing.id,
      };
      const accessToken = this.jwtService.sign(payload);

      existing.accessToken = accessToken;
      await this.cameraRepo.save(existing);

      return { accessToken };
    }

    // 创建新摄像头
    const camera = this.cameraRepo.create({ deviceId });

    // 先使用临时 cameraId 生成 accessToken，避免 NOT NULL 约束错误
    const payload: CameraJwtPayload = {
      sub: deviceId,
      type: 'camera',
      cameraId: 0,
    };
    camera.accessToken = this.jwtService.sign(payload);
    await this.cameraRepo.save(camera);

    // 用真实的 cameraId 重新生成 token
    payload.cameraId = camera.id;
    const finalAccessToken = this.jwtService.sign(payload);
    camera.accessToken = finalAccessToken;
    await this.cameraRepo.save(camera);

    return { accessToken: finalAccessToken };
  }

  /**
   * 更新摄像头状态（位置、在线状态、最后活跃时间）
   */
  async updateStatus(
    deviceId: string,
    lat: number,
    lng: number,
    status: CameraStatus,
  ) {
    const camera = await this.cameraRepo.findOne({ where: { deviceId } });
    if (!camera) {
      throw new NotFoundException('摄像头不存在');
    }

    camera.lat = lat;
    camera.lng = lng;
    camera.status = status;
    camera.lastSeenAt = new Date();

    await this.cameraRepo.save(camera);

    return { message: 'Status updated' };
  }

  /**
   * 获取所有摄像头列表（不返回 accessToken）
   */
  async findAll(condition?: string) {
    const query = this.cameraRepo.createQueryBuilder('camera');

    // 不返回 accessToken 字段
    query.select([
      'camera.id',
      'camera.deviceId',
      'camera.lat',
      'camera.lng',
      'camera.status',
      'camera.lastSeenAt',
      'camera.createdAt',
    ]);

    if (condition) {
      // 支持按状态筛选
      query.where('camera.status = :condition', { condition });
    }

    return query.getMany();
  }

  /**
   * 删除摄像头（仅测试环境可用）
   */
  async remove(id: number) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      throw new ForbiddenException('生产环境不允许删除摄像头');
    }

    const camera = await this.cameraRepo.findOne({ where: { id } });
    if (!camera) {
      throw new NotFoundException('摄像头不存在');
    }

    await this.cameraRepo.remove(camera);
  }
}
