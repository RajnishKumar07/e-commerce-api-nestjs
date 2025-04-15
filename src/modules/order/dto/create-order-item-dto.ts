import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Name of the product',
    example: 'Wireless Headphones',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Image URL of the product',
    example: 'https://example.com/images/product.jpg',
  })
  @IsString()
  image: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 129.99,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Quantity of the product to order',
    example: 2,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'ID of the product being ordered',
    example: 101,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
