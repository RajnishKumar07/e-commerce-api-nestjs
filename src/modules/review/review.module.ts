import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/modules/product/product.entity';
import { ProductService } from 'src/modules/product/product.service';
import { Review } from 'src/modules/review/review.entity';
import { User } from 'src/modules/user/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { HandleJwtService } from 'src/shared/services/jwt.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Product, User])],
  controllers: [ReviewController],
  providers: [ReviewService, ProductService, UserService, HandleJwtService],
})
export class ReviewModule {}
