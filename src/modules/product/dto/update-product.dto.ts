// import { PartialType } from '@nestjs/mapped-types';
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from 'src/modules/product/dto/create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
