import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { NovelModule } from './novel/novel.module';

@Module({
  imports: [AuthModule, NovelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
