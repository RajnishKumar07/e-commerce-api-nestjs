import {
  Body,
  Controller,
  Delete,
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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(
    @CurrentUser('userId') userId: number,
    @Body() createProductDto: CreateProductDto,
  ) {
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
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 1 * 1024 * 1024 })],
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
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiResponse({ status: 200, description: 'List of products' })
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
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  @Get(':id')
  @IsPublic()
  @ApiOperation({ summary: 'Get single product by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product fetched successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
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
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  @Post(':id')
  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
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
        'Product updated successfully!',
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
  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
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
