// src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { IsEmail, Length } from 'class-validator';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @IsEmail()
  email!: string;

  @Column()
  @Length(6, 20)
  password_hash!: string;

  @Column({ nullable: true })
  first_name!: string;

  @Column({ nullable: true })
  last_name!: string;

  @Column({ default: true })
  is_active!: boolean;

  // 简化的角色存储 - 直接存储角色数组，避免中间表
  @Column({
    type: 'text',
    array: true,
    default: ['viewer']
  })
  roles!: string[];

  @Column({ default: false })
  is_protected!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password_hash) {
      this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
  }
}
