import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from 'src/modules/product/dto/create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
