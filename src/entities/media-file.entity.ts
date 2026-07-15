// src/entities/media-file.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity()
export class MediaFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  cameraId!: number;

  @Column({ type: 'int', nullable: true })
  eventId!: number | null;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  mediaType!: MediaType;

  @Column({ type: 'varchar', length: 500 })
  filePath!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ type: 'int' })
  fileSize!: number;

  @Column({ type: 'timestamp' })
  capturedAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
