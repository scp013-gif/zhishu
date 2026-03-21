import { Module } from '@nestjs/common';
import { NovelService } from './novel.service';
import { NovelController } from './novel.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[PrismaModule,AuthModule],
  controllers: [NovelController],
  providers: [NovelService],
  exports:[NovelService] // 导出供聊天模块使用
})
export class NovelModule {}
