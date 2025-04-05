import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { AppLoggerModule } from './modules/logger/logger.module';
import { OrderModule } from './modules/order/order.module';
import { ProductReservationsModule } from './modules/product-reservations/product-reservations.module';
import { ProductModule } from './modules/product/product.module';
import { ReviewModule } from './modules/review/review.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_LIFETIME') },
      }),
      inject: [ConfigService],
      global: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get<string>('NODE_ENV') === 'development';

        return {
          pinoHttp: isDev
            ? {
                transport: {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                },
                level: 'debug',
              }
            : {
                transport: {
                  targets: [
                    {
                      target: 'pino/file',
                      options: {
                        destination: 'logs/combined.log',
                      },
                      level: 'info',
                    },
                    {
                      target: 'pino/file',
                      options: {
                        destination: 'logs/error.log',
                      },
                      level: 'error',
                    },
                  ],
                },
                level: 'info',
              },
        };
      },
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    ProductModule,
    ReviewModule,
    OrderModule,
    ProductReservationsModule,
    CartModule,
    AppLoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
