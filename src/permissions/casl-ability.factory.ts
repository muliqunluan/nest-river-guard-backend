import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { User } from '../entities/user.entity';
import { Action } from './enums/action.enum';

export type AppAbility = MongoAbility;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    // ──────────────────────────────────────────────
    // 1. 管理员权限：admin 角色获得全部管理能力
    // ──────────────────────────────────────────────
    if (user.roles.includes('admin')) {
      can(Action.Manage, 'all');
    }

    return build({
      detectSubjectType: (object) => object.constructor.name as any,
    });
  }
}
