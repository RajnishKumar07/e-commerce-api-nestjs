import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { checkPermissions } from 'src/common/utils/check-permission.util';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { ProductService } from 'src/modules/product/product.service';
import { CreateReviewDto } from 'src/modules/review/dto/create-review.dto';
import { UpdateReviewDto } from 'src/modules/review/dto/update-review.dto';
import { ReviewService } from 'src/modules/review/review.service';
import { UserService } from 'src/modules/user/user.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(
    private productService: ProductService,
    private reviewService: ReviewService,
    private userService: UserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a review for a product' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid product or duplicate review',
  })
  async createReview(
    @CurrentUser('userId') userId: number,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    try {
      const { product: productId } = createReviewDto;

      const isValidProduct =
        await this.productService.getSingleProductDetail(productId);

      if (!isValidProduct) {
        throw new NotFoundException(`No product with id : ${productId}`);
      }

      const isAlreadySubmitted = await this.reviewService.getOneReview(
        productId,
        userId,
      );
      if (isAlreadySubmitted) {
        throw new BadRequestException(
          'Already submitted review for this product',
        );
      }
      const user = await this.userService.findUserById(userId);

      const review = await this.reviewService.createReview(
        user,
        isValidProduct,
        createReviewDto,
      );

      return createResponse(
        HttpStatus.CREATED,
        'Review created successfully!',
        review,
      );
    } catch (error) {
      console.log('error=====>', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({ status: 200, description: 'All reviews fetched successfully' })
  async getAllReview() {
    try {
      const review = await this.reviewService.getAllReview();
      return createResponse(HttpStatus.OK, 'Review Found successfully', review);
    } catch (error) {
      throw new InternalServerErrorException('Failed to Fetch review');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single review by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review found successfully' })
  @ApiResponse({ status: 404, description: 'No Review Found with this ID' })
  async getSingleReview(@Param('id', ParseIntPipe) reviewId: number) {
    try {
      if (!reviewId) {
        throw new BadRequestException('Reveiw Id is required');
      }
      const review = await this.reviewService.getReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`No Review Found with id ${reviewId}`);
      }

      return createResponse(
        HttpStatus.OK,
        'Review found successfully!',
        review,
      );
    } catch (error) {
      console.log('error--->', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch review');
    }
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update a review by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 404, description: 'No review found' })
  async updateReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: ITokenUser,
  ) {
    try {
      const review = await this.reviewService.updateReview(
        updateReviewDto,
        reviewId,
        user,
      );
      return createResponse(
        HttpStatus.OK,
        'Review updated successfully',
        review,
      );
    } catch (error) {
      console.log('error--->', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update review');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: ITokenUser,
  ) {
    try {
      const review = await this.reviewService.getReviewById(reviewId);
      if (!review) {
        throw new NotFoundException(`No review found with id ${reviewId}`);
      }
      console.log('DELETE============>', user, review.user);
      checkPermissions(user, review.user.id);

      await this.reviewService.deleteReview(reviewId);
      return createResponse(HttpStatus.OK, 'Success! review removed');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete review');
    }
  }
}
