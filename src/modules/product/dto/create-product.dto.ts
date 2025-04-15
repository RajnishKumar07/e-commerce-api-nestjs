import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  ProductCategory,
  ProductCompany,
} from 'src/modules/product/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'Smartphone' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 499.99 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'High-end smartphone with amazing camera' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  description: string;

  @ApiPropertyOptional({ example: 'smartphone.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  image: string;

  @ApiProperty({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ enum: ProductCompany })
  @IsEnum(ProductCompany)
  company: ProductCompany;

  @ApiPropertyOptional({ example: ['red', 'blue'], type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  colors: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  featured: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  freeShipping: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  inventory: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsNumber()
  @IsOptional()
  averageRating: number;

  @ApiPropertyOptional({ example: 7 })
  @IsInt()
  @IsOptional()
  numOfReviews: number;
}
