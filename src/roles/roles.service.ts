// src/roles/roles.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 获取所有角色
  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions', 'permissions.permission'],
    });
  }

  // 通过ID获取角色
  async findById(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  // 通过名称获取角色
  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions', 'permissions.permission'],
    });
  }

  // 创建新角色
  async create(name: string): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });

    if (existingRole) {
      throw new NotFoundException(`Role with name "${name}" already exists`);
    }

    const role = this.roleRepository.create({ name });
    return this.roleRepository.save(role);
  }

  // 更新角色
  async update(id: number, name: string): Promise<Role> {
    const role = await this.findById(id);
    role.name = name;
    return this.roleRepository.save(role);
  }

  // 删除角色
  async remove(id: number): Promise<void> {
    const role = await this.findById(id);
    await this.roleRepository.remove(role);
  }

  // 获取角色的所有权限
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });

    return rolePermissions.map(rp => rp.permission);
  }

  // 为角色分配权限
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<string> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const permission = await this.permissionRepository.findOne({ where: { id: permissionId } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    const existingRolePermission = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } },
    });

    if (existingRolePermission) {
      return `Role ${role.name} already has permission ${permission.action}:${permission.resource}`;
    }

    const rolePermission = this.rolePermissionRepository.create({ role, permission });
    await this.rolePermissionRepository.save(rolePermission);

    return `Permission ${permission.action}:${permission.resource} successfully assigned to role ${role.name}`;
  }

  // 从角色移除权限
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<string> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const permission = await this.permissionRepository.findOne({ where: { id: permissionId } });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    }

    const existingRolePermission = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } },
    });

    if (!existingRolePermission) {
      return `Role ${role.name} does not have permission ${permission.action}:${permission.resource}`;
    }

    await this.rolePermissionRepository.remove(existingRolePermission);

    return `Permission ${permission.action}:${permission.resource} successfully removed from role ${role.name}`;
  }

  // 获取拥有指定角色的所有用户
  async getUsersWithRole(roleId: number): Promise<User[]> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // 查找所有包含该角色名称的用户
    const users = await this.userRepository.find();
    return users.filter(user => user.roles && user.roles.includes(role.name));
  }

  // 通过邮箱为用户分配角色
  async assignRoleToUserByEmail(email: string, roleName: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    // 检查用户是否已有该角色
    if (user.roles && user.roles.includes(roleName)) {
      return `User ${email} already has role ${roleName}`;
    }

    // 添加角色到用户的roles数组
    if (!user.roles) {
      user.roles = [];
    }
    user.roles.push(roleName);
    await this.userRepository.save(user);

    return `Role ${roleName} successfully assigned to user ${email}`;
  }

  // 通过邮箱从用户移除角色
  async removeRoleFromUserByEmail(email: string, roleName: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    // 检查用户是否有该角色
    if (!user.roles || !user.roles.includes(roleName)) {
      return `User ${email} does not have role ${roleName}`;
    }

    // 保护检查：受保护用户的 admin 角色不可被移除
    if (roleName === 'admin' && user.is_protected) {
      throw new ForbiddenException('受保护用户的管理员角色不可被移除');
    }

    // 从用户的roles数组中移除角色
    user.roles = user.roles.filter(r => r !== roleName);
    await this.userRepository.save(user);

    return `Role ${roleName} successfully removed from user ${email}`;
  }
}