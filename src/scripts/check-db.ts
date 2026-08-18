import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function checkDatabase() {
  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule);
  } catch (error) {
    console.error('❌ 数据库连接失败，无法继续部署：', (error as Error).message);
    process.exit(1);
  }

  try {
    const queryRunner = app.get(DataSource).createQueryRunner();
    const table = await queryRunner.getTable('user');
    if (!table) throw new Error('user 表不存在');

    if (!table.columns.some((col) => col.name === 'roles')) {
      await queryRunner.query(
        `ALTER TABLE "user" ADD COLUMN "roles" text[] DEFAULT ARRAY['viewer']`,
      );
      console.log('✅ 已补充 roles 列');
    }
    await queryRunner.release();
    console.log('✅ 数据库连接与表结构检查通过，继续部署...');
  } catch (error) {
    console.error('❌ 检查数据库时出错：', (error as Error).message);
    process.exit(1);
  } finally {
    await app.close();
  }

  process.exit(0);
}

checkDatabase();
