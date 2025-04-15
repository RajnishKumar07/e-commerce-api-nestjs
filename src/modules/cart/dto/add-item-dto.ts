import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddCartItemDtO {
  @ApiProperty({
    example: 2,
    description: 'Quantity of the product to add/update in cart',
    minimum: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
