import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PoliciesGuard } from './guards/policies.guard';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission]), AuthModule],
  controllers: [PermissionsController],
  providers: [CaslAbilityFactory, PoliciesGuard, PermissionsService],
  exports: [CaslAbilityFactory, PoliciesGuard, PermissionsService],
})
export class PermissionsModule {}
