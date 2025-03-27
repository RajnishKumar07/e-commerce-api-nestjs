import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from 'src/modules/order/dto/create-order-dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
