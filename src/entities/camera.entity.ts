// src/entities/camera.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CameraStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

@Entity()
export class Camera {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  deviceId!: string;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'float', nullable: true })
  lat!: number | null;

  @Column({ type: 'float', nullable: true })
  lng!: number | null;

  @Column({
    type: 'enum',
    enum: CameraStatus,
    default: CameraStatus.OFFLINE,
  })
  status!: CameraStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
