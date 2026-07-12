import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../casl-ability.factory';
import { Action } from '../enums/action.enum';

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);

export type PolicyHandler = (ability: AppAbility, request?: any) => boolean;

export class Policies {
  static canCreate(subject: string): PolicyHandler {
    return (ability: AppAbility) => ability.can(Action.Create, subject);
  }

  static canRead(subject: string): PolicyHandler {
    return (ability: AppAbility) => ability.can(Action.Read, subject);
  }

  static canUpdate(subject: string): PolicyHandler {
    return (ability: AppAbility) => ability.can(Action.Update, subject);
  }

  static canDelete(subject: string): PolicyHandler {
    return (ability: AppAbility) => ability.can(Action.Delete, subject);
  }

  static canManage(subject: string): PolicyHandler {
    return (ability: AppAbility) => ability.can(Action.Manage, subject);
  }

  static canReadOwnResource(subject: string, resourceIdParam: string = 'id'): PolicyHandler {
    return (ability: AppAbility, request: any) => {
      const resourceId = request.params[resourceIdParam];
      
      // 列表查询（如 GET /maps/my）没有 :id 参数，检查用户是否有读取能力即可
      if (!resourceId) {
        return ability.can(Action.Read, subject) ||
               ability.can(Action.Manage, subject);
      }
      
      // 单个资源查询有 :id 参数
      return ability.can(Action.Read, subject) ||
             ability.can(Action.Manage, subject);
    };
  }

  static canUpdateOwnResource(subject: string, resourceIdParam: string = 'id'): PolicyHandler {
    return (ability: AppAbility, request: any) => {
      const resourceId = request.params[resourceIdParam];
      
      if (!resourceId) {
        return ability.can(Action.Update, subject) ||
               ability.can(Action.Manage, subject);
      }
      
      return ability.can(Action.Update, subject) ||
             ability.can(Action.Manage, subject);
    };
  }

  static canDeleteOwnResource(subject: string, resourceIdParam: string = 'id'): PolicyHandler {
    return (ability: AppAbility, request: any) => {
      const resourceId = request.params[resourceIdParam];
      
      if (!resourceId) {
        return ability.can(Action.Delete, subject) ||
               ability.can(Action.Manage, subject);
      }
      
      return ability.can(Action.Delete, subject) ||
             ability.can(Action.Manage, subject);
    };
  }
}