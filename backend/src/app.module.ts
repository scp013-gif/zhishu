import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NovelModule } from './novel/novel.module';
import { ZillizModule } from './zilliz/zilliz.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 全局环境变量
    PrismaModule,
    AuthModule,
    NovelModule,
    ZillizModule,
    ChatModule,
  ],
})
export class AppModule {}