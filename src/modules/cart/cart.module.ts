import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from 'src/modules/cart/entity/cart.entity';
import { Product } from 'src/modules/product/product.entity';
import { User } from 'src/modules/user/user.entity';
import { HandleJwtService } from 'src/shared/services/jwt.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, User, Product])],
  controllers: [CartController],
  providers: [CartService, HandleJwtService],
})
export class CartModule {}
