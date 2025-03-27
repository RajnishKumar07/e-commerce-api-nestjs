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
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  description: string;

  @IsOptional()
  @MaxLength(100)
  image: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsEnum(ProductCompany)
  company: ProductCompany;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  colors: string[];

  @IsBoolean()
  @IsOptional()
  featured: boolean;

  @IsBoolean()
  @IsOptional()
  freeShipping: boolean;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  inventory: number;

  @IsNumber()
  @IsOptional()
  averageRating: number;

  @IsInt()
  @IsOptional()
  numOfReviews: number;
}

//   export class UpdateProductDto {
//     name: string;
//     price: number;
//     description: string;
//     image: string;
//     category: ProductCategory;
//     company: ProductCompany;
//     colors: string[];
//     featured: boolean;
//     freeShipping: boolean;
//     inventory: number;
//     averageRating: number;
//     numOfReviews: number;
//   }
