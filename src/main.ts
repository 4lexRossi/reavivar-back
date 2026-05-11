import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT ?? 3000);
  }
  
  return app.getHttpAdapter().getInstance();
}

let handler: any;
export default async (req: any, res: any) => {
  if (!handler) {
    handler = await bootstrap();
  }
  return handler(req, res);
};

// Keep for local dev
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
