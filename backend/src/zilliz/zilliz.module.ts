import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZillizService } from './zilliz.service';

@Module({
  imports: [ConfigModule],
  providers: [ZillizService],
  exports: [ZillizService],
})
export class ZillizModule {}