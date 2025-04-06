import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { IsPublic } from 'src/common/decorators/is-public.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { multerConfig } from 'src/common/utils/multer.config';
import {
  createListResponse,
  createResponse,
} from 'src/common/utils/response.util';
import { CreateProductDto } from 'src/modules/product/dto/create-product.dto';
import { UpdateProductDto } from 'src/modules/product/dto/update-product.dto';
import { ProductService } from 'src/modules/product/product.service';
import { ListQueryDto } from 'src/shared/dto/list-query.dto';

@UseGuards(AuthGuard)
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}
  @Post()
  async createProduct(
    @CurrentUser('userId') userId: number,
    @Body() createProductDto: CreateProductDto,
  ) {
    console.log('product');
    try {
      const product = await this.productService.createProduct(
        createProductDto,
        userId,
      );
      return createResponse(
        HttpStatus.CREATED,
        'Product created successfully!',
        product,
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to create Product');
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1 * 1024 * 1024 }), // 1MB file limit
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }), // Validate image type
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const { image } = this.productService.uploadFile(file);

      return createResponse(HttpStatus.OK, 'Image uploaded successfully', {
        image,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  @Get()
  @IsPublic()
  async getAllProducts(
    @Query() query: ListQueryDto,
    @CurrentUser('userId') userId: number,
  ) {
    const { search, sort, page = 1, limit = 10 } = query;
    try {
      const { products, totalProducts, numOfPages } =
        await this.productService.getAllProducts(query, userId);

      return createListResponse(
        products,
        totalProducts,
        page,
        limit,
        numOfPages,
      );
    } catch (error) {
      console.log('error----->', error);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  @Get(':id')
  @IsPublic()
  async getSingleProduct(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser('userId') userId: number,
  ) {
    try {
      const product = await this.productService.getSingleProduct(
        productId,
        userId,
      );
      if (!product) {
        throw new NotFoundException(`No Product Found with id: ${productId}`);
      }
      return createResponse(
        HttpStatus.OK,
        'Product found successfully',
        product,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  @Post(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    try {
      const product = await this.productService.updateProduct(
        productId,
        updateProductDto,
      );

      return createResponse(
        HttpStatus.OK,
        'Product update successfully!',
        product,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update Product');
    }
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) productId: number) {
    try {
      await this.productService.deleteProduct(productId);

      return createResponse(HttpStatus.OK, 'Success! product removed');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to remove Product');
    }
  }
}
