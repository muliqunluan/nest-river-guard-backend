// src/user/user.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { In } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // 获取用户详细信息
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  // 通过邮箱获取用户信息（不返回密码哈希）
  async findByEmail(email: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) return null;

    // 排除密码哈希，避免泄露
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // 更新用户角色
  async updateUserRoles(email: string, roles: string[]) {
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 根据角色名称查找角色实体
    const roleEntities = await this.roleRepository.find({
      where: { name: In(roles) }
    });

    if (roleEntities.length !== roles.length) {
      throw new NotFoundException('Some roles not found');
    }

    // 保护检查：如果用户是受保护的且新角色数组中不包含 admin，则拒绝
    if (user.is_protected && !roles.includes('admin')) {
      throw new ForbiddenException('受保护用户必须保留 admin 角色');
    }

    // 直接更新用户的roles数组
    user.roles = roles;
    await this.userRepository.save(user);

    return this.findById(user.id);
  }

  // 为用户分配单个角色
  async assignRoleToUser(email: string, roleName: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found.`);
    }

    // 检查用户是否已有该角色
    if (user.roles && user.roles.includes(roleName)) {
      return `User already has the ${roleName} role.`;
    }

    // 添加角色到用户的roles数组
    if (!user.roles) {
      user.roles = [];
    }
    user.roles.push(roleName);
    await this.userRepository.save(user);

    return `Role ${roleName} successfully assigned to ${email}.`;
  }

  // 从用户移除角色
  async removeRoleFromUser(email: string, roleName: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found.`);
    }

    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found.`);
    }

    // 检查用户是否有该角色
    if (!user.roles || !user.roles.includes(roleName)) {
      return `User does not have the ${roleName} role.`;
    }

    // 保护检查：受保护用户的 admin 角色不可被移除
    if (roleName === 'admin' && user.is_protected) {
      throw new ForbiddenException('受保护用户的管理员角色不可被移除');
    }

    // 从用户的roles数组中移除角色
    user.roles = user.roles.filter(r => r !== roleName);
    await this.userRepository.save(user);

    return `Role ${roleName} successfully removed from ${email}.`;
  }

  // 获取用户的所有角色名称
  async getUserRoleNames(userId: number): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.roles || [];
  }
}
