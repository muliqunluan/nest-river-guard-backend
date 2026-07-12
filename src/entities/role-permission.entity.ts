// src/entities/role-permission.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity()
export class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role, role => role.permissions)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, permission => permission.roles)
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
