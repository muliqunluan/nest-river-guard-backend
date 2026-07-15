// src/events/events.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventSeverity, EventStatus } from '../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
  ) {}

  /**
   * 摄像头上报事件
   */
  async create(cameraId: number, dto: CreateEventDto) {
    const event = this.eventRepo.create({
      cameraId,
      type: dto.type,
      severity: dto.severity,
      description: dto.description ?? null,
      metadata: dto.metadata ?? null,
      occurredAt: new Date(dto.occurredAt),
    });

    return this.eventRepo.save(event);
  }

  /**
   * 查询事件列表（支持分页和多条件筛选）
   */
  async findAll(query: QueryEventDto) {
    const qb = this.eventRepo.createQueryBuilder('event');

    if (query.cameraId) {
      qb.andWhere('event.cameraId = :cameraId', { cameraId: query.cameraId });
    }
    if (query.type) {
      qb.andWhere('event.type = :type', { type: query.type });
    }
    if (query.severity) {
      qb.andWhere('event.severity = :severity', { severity: query.severity });
    }
    if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }
    if (query.startTime) {
      qb.andWhere('event.occurredAt >= :startTime', { startTime: new Date(query.startTime) });
    }
    if (query.endTime) {
      qb.andWhere('event.occurredAt <= :endTime', { endTime: new Date(query.endTime) });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    qb.orderBy('event.occurredAt', 'DESC')
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
   * 获取事件详情
   */
  async findOne(id: number) {
    const event = await this.eventRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    return event;
  }

  /**
   * 更新事件（状态/描述/严重级别）
   */
  async update(id: number, dto: UpdateEventDto) {
    const event = await this.findOne(id);

    if (dto.status !== undefined) {
      event.status = dto.status;
    }
    if (dto.severity !== undefined) {
      event.severity = dto.severity;
    }
    if (dto.description !== undefined) {
      event.description = dto.description;
    }

    return this.eventRepo.save(event);
  }
}
