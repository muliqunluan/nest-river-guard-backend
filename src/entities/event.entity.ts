// src/entities/event.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum EventStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  cameraId!: number;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({
    type: 'enum',
    enum: EventSeverity,
    default: EventSeverity.INFO,
  })
  severity!: EventSeverity;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status!: EventStatus;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ type: 'timestamp' })
  occurredAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
