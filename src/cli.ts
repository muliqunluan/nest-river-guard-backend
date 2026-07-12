import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CommandService } from 'nestjs-command';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logger = new Logger('CLI');
  logger.log('Command line tool initialized.');

  try {
    // 获取 CommandService 并执行命令
    await app.get(CommandService).exec();
    await app.close();
  } catch (error) {
    logger.error('Command failed:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();