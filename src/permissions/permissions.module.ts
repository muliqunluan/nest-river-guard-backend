import { Global, Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './guards/policies.guard';

@Global()
@Module({
  providers: [CaslAbilityFactory, PoliciesGuard],
  exports: [CaslAbilityFactory, PoliciesGuard],
})
export class PermissionsModule {}