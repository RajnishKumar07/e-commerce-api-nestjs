import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<string>('JWT_SECRET');
  app.use(cookieParser(cookieSecret));

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to be objects
      whitelist: true, // Strip properties that do not have decorators
    }),
  );

  // Register global interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
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

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('E-COMMERCE-API')
    .setDescription(
      `
    ## Authentication Flow
    1. First call the /auth/login endpoint
    2. It will set an httpOnly cookie named 'token'
    3. All subsequent requests will automatically use this cookie
  `,
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1, // cleaner UI
      docExpansion: 'none',
      operationsSorter: (a, b) => {
        if (a.get('path').includes('login')) return -1;
        return a.get('method').localeCompare(b.get('method'));
      },

      tagsSorter: 'alpha',
      withCredentials: true, // crucial for cookies
    },
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
