import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  image: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
