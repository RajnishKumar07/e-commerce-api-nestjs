import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMiddleware } from './common/middlewares/logging.middleware';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
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
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    ProductModule,
    ReviewModule,
    OrderModule,
    ProductReservationsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
    // consumer
    //   // Apply raw-body parser only on the Stripe webhook POST path
    //   .apply(RawBodyMiddleware)
    //   .forRoutes({ path: '/stripe/webhook', method: RequestMethod.POST })
    //   // Apply JSON parser for all other routes
    //   .apply(JsonBodyMiddleware)
    //   .forRoutes('*');
  }
}
