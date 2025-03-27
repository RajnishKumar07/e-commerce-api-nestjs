import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from 'src/modules/order/entity/order-item.entity';
import { Order } from 'src/modules/order/entity/order.entity';
import { ProductReservations } from 'src/modules/product-reservations/product-reservations.entity';
import { ProductReservationsService } from 'src/modules/product-reservations/product-reservations.service';
import { Product } from 'src/modules/product/product.entity';
import { ProductService } from 'src/modules/product/product.service';
import { User } from 'src/modules/user/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { HandleJwtService } from 'src/shared/services/jwt.service';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { StripeController } from './stripe/stripe.controller';
import { StripeService } from './stripe/stripe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      User,
      ProductReservations,
    ]),
  ],
  providers: [
    OrderService,
    HandleJwtService,
    UserService,
    StripeService,
    ProductService,
    ProductReservationsService,
  ],
  controllers: [OrderController, StripeController],
})
export class OrderModule {}
