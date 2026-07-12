import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

async function initTestData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
    const dataSource = app.get(DataSource);
    
    // 创建角色
    const roles = [
      { name: 'admin' },
      { name: 'editor' },
      { name: 'viewer' }
    ];
    
    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`✅ 创建角色: ${roleData.name}`);
      } else {
        console.log(`ℹ️  角色已存在: ${roleData.name}`);
      }
    }
    
    // 创建测试用户
    const users = [
      { 
        email: 'admin@test.com', 
        password: 'admin123', 
        first_name: 'Admin', 
        last_name: 'User',
        roles: ['admin']
      },
      { 
        email: 'editor@test.com', 
        password: 'editor123', 
        first_name: 'Editor', 
        last_name: 'User',
        roles: ['editor']
      },
      { 
        email: 'viewer@test.com', 
        password: 'viewer123', 
        first_name: 'Viewer', 
        last_name: 'User',
        roles: ['viewer']
      },
      { 
        email: 'multi@test.com', 
        password: 'multi123', 
        first_name: 'Multi', 
        last_name: 'Role',
        roles: ['editor', 'viewer']
      }
    ];
    
    for (const userData of users) {
      const existingUser = await userRepository.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        // 使用原始 SQL 插入用户，正确处理数组格式
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const rolesArray = `{${userData.roles.join(',')}}`;
        
        await dataSource.query(
          `INSERT INTO "user" (email, password_hash, first_name, last_name, is_active, roles)
           VALUES ($1, $2, $3, $4, DEFAULT, $5)`,
          [userData.email, hashedPassword, userData.first_name, userData.last_name, rolesArray]
        );
        
        console.log(`✅ 创建用户: ${userData.email} (角色: ${userData.roles.join(', ')})`);
      } else {
        console.log(`ℹ️  用户已存在: ${userData.email}`);
      }
    }
    
    console.log('\n🎉 测试数据初始化完成！');
    console.log('\n测试账户:');
    console.log('管理员: admin@test.com / admin123');
    console.log('编辑者: editor@test.com / editor123');
    console.log('查看者: viewer@test.com / viewer123');
    console.log('多角色: multi@test.com / multi123');
    
  } catch (error) {
    console.error('初始化测试数据时出错:', error);
  } finally {
    await app.close();
  }
}

initTestData();