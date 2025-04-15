import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from 'src/modules/order/dto/create-order-item-dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Shipping fee for the order',
    example: 50,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  shippingFee: number;

  @ApiProperty({
    description: 'List of items in the order',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
