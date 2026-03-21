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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
