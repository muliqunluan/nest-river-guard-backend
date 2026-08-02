import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { User } from '../entities/user.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Action } from './enums/action.enum';

export type AppAbility = MongoAbility;

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    // ──────────────────────────────────────────────
    // 1. 管理员权限：admin 角色获得全部管理能力
    // ──────────────────────────────────────────────
    if (user.roles?.includes('admin')) {
      can(Action.Manage, 'all');
    }

    // ──────────────────────────────────────────────
    // 2. 角色权限：根据用户拥有的角色，从 role_permission
    //    加载该角色被分配的权限（action:resource）
    // ──────────────────────────────────────────────
    if (user.roles && user.roles.length > 0) {
      const rolePermissions = await this.rolePermissionRepository.find({
        where: { role: { name: In(user.roles) } },
        relations: ['permission'],
      });

      for (const rp of rolePermissions) {
        if (rp.permission) {
          can(rp.permission.action, rp.permission.resource);
        }
      }
    }

    return build({
      detectSubjectType: (object) => object.constructor.name as any,
    });
  }
}
