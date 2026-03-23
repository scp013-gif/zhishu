import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule,{
    cors:true
  });
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    transform:true
  }))
  // 增加整体请求体限制，虽然 FileInterceptor 独立处理，但设置全局大一点更保险
  app.use(require('body-parser').json({limit: '50mb'}));
  app.use(require('body-parser').urlencoded({limit: '50mb', extended: true}));
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
