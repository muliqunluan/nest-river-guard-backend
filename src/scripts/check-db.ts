import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';

async function checkDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    // 检查 user 表的结构
    const userRepository = dataSource.getRepository(User);
    const queryRunner = dataSource.createQueryRunner();
    
    // 获取 user 表的列信息
    const tableColumns = await queryRunner.getTable('user');
    
    if (tableColumns) {
      console.log('User 表的列信息:');
      tableColumns.columns.forEach(column => {
        console.log(`- ${column.name}: ${column.type}`);
      });
      
      // 检查 roles 列是否存在
      const rolesColumn = tableColumns.columns.find(col => col.name === 'roles');
      if (rolesColumn) {
        console.log('\n✅ roles 列存在于 user 表中');
      } else {
        console.log('\n❌ roles 列不存在于 user 表中');
        
        // 尝试添加 roles 列
        console.log('尝试添加 roles 列...');
        await queryRunner.query(`
          ALTER TABLE "user" 
          ADD COLUMN "roles" text[] DEFAULT ARRAY['viewer']
        `);
        console.log('✅ 成功添加 roles 列');
      }
    } else {
      console.log('❌ user 表不存在');
    }
    
    await queryRunner.release();
  } catch (error) {
    console.error('检查数据库时出错:', error);
  } finally {
    await app.close();
  }
}

checkDatabase();