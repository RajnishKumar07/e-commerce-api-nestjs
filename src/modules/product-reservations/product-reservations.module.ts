import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReservations } from 'src/modules/product-reservations/product-reservations.entity';
import { Product } from 'src/modules/product/product.entity';
import { ProductService } from 'src/modules/product/product.service';
import { User } from 'src/modules/user/user.entity';
import { ProductReservationsController } from './product-reservations.controller';
import { ProductReservationsService } from './product-reservations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReservations, Product, User])],
  providers: [ProductReservationsService, ProductService],
  controllers: [ProductReservationsController],
})
export class ProductReservationsModule {}
