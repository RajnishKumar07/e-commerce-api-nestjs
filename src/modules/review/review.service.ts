import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { checkPermissions } from 'src/common/utils/check-permission.util';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { AppLoggerService } from 'src/modules/logger/logger.service';
import { Product } from 'src/modules/product/product.entity';
import { CreateReviewDto } from 'src/modules/review/dto/create-review.dto';
import { UpdateReviewDto } from 'src/modules/review/dto/update-review.dto';
import { Review } from 'src/modules/review/review.entity';
import { User } from 'src/modules/user/user.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class ReviewService {
  constructor(
    private readonly logger: AppLoggerService,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource, // Used for transactions
  ) {
    this.logger.setContext(ReviewService.name);
  }

  async createReview(
    user: User,
    product: Product,
    createReviewDto: CreateReviewDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const { product: productId, ...res } = createReviewDto;

      const review = await manager
        .createQueryBuilder()
        .insert()
        .into(Review)
        .values({
          ...res,
          user: user,
          product,
        })
        .execute();
      await this.calculateAverageRating(manager, productId);
      return review;
    });
  }

  async getOneReview(productId: number, userId: number) {
    return await this.reviewRepository
      .createQueryBuilder('rev')
      .where('rev.userId=:userId', { userId })
      .andWhere('rev.productId=:productId', { productId })
      .getOne();
  }

  async getAllReview() {
    return await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.product', 'prod')
      .addSelect(['prod.id', 'prod.name', 'prod.price', 'prod.company'])
      .getMany();
  }

  async getReviewById(reviewId: number) {
    return await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.product', 'product')
      .leftJoin('review.user', 'user')
      .addSelect([
        'product.id',
        'product.name',
        'product.company',
        'product.price',
      ])
      .addSelect(['user.id', 'user.name'])
      .where('review.id=:id', { id: reviewId })
      .getOne();
  }

  async updateReview(
    updateReviewDto: UpdateReviewDto,
    reviewId: number,
    user: ITokenUser,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const review = await manager
        .createQueryBuilder(Review, 'review')
        .leftJoin('review.user', 'user')
        .addSelect(['user.id', 'user.name'])
        .where('review.id=:id', { id: reviewId })
        .getOne();
      if (!review) {
        throw new NotFoundException(`No review found with id ${reviewId}`);
      }

      checkPermissions(user, review.user.id);

      const { comment, rating, title } = updateReviewDto;

      await manager
        .createQueryBuilder()
        .update(Review)
        .set({
          comment,
          rating,
          title,
        })
        .where('id=:id', { id: reviewId })
        .execute();

      const updatedReview = await manager
        .createQueryBuilder(Review, 'review')
        .leftJoin('review.user', 'user')
        .leftJoin('review.product', 'product')
        .addSelect(['user.id', 'user.name'])
        .addSelect(['product.id', 'product.name'])
        .where('review.id=:id', { id: reviewId })
        .getOne();
      await this.calculateAverageRating(manager, updatedReview.product.id);
      return updatedReview;
    });
  }

  async deleteReview(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const review = await this.getReviewById(id);
      const deleted = await manager
        .createQueryBuilder()
        .delete()
        .from(Review)
        .where('id=:id', { id: id })
        .execute();
      await this.calculateAverageRating(manager, review.product.id);

      return deleted;
    });
  }

  private async calculateAverageRating(manager, productId) {
    const rating = await manager
      .createQueryBuilder()
      .select('COUNT(review.id)', 'count')
      .addSelect('AVG(review.rating)', 'avg')
      .from(Review, 'review')
      .where('review.productId=:productId', { productId })
      .getRawOne();

    await manager
      .createQueryBuilder()
      .update(Product)
      .set({
        averageRating: parseFloat(rating.avg) || 0,
        numOfReviews: parseInt(rating.count) || 0,
      })
      .where('id=:id', { id: productId })
      .execute();
  }
}
