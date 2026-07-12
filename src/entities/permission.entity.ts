// src/entities/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @OneToMany(() => RolePermission, rolePermission => rolePermission.permission)
  roles!: RolePermission[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
