import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import * as path from 'path';
import { AppLoggerService } from 'src/modules/logger/logger.service';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<string>('JWT_SECRET');

  app.use(cookieParser(cookieSecret));

  app.useLogger(app.get(Logger));

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to be objects
      whitelist: true, // Strip properties that do not have decorators
    }),
  );

  // Register global interceptor
  const logger = app.get(AppLoggerService); //  Get logger from DI container
  app.useGlobalFilters(new HttpExceptionFilter(logger)); //  Pass logger manually

  app.useGlobalInterceptors(new TransformInterceptor());
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5000'], // Allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    allowedHeaders: 'Content-Type, Accept, Authorization,X-Show-Toast', // Allowed headers
    credentials: true, // Include cookies and credentials
  });

  // Serve static files from the "uploads" folder
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads', // Access files via "/uploads/<filename>"
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
