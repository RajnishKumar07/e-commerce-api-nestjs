import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from 'src/modules/order/dto/create-order-item-dto';

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  shippingFee: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
