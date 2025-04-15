import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 4,
    description: 'Rating for the product (1 to 5)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({
    example: 'Great product!',
    description: 'Title of the review (max 100 characters)',
  })
  @IsNotEmpty()
  @MaxLength(100)
  @Transform((params) => params.value.trim())
  title: string;

  @ApiProperty({
    example: 'I really enjoyed using this product. Highly recommended!',
    description: 'Detailed comment about the product',
  })
  @IsNotEmpty()
  @Transform((params) => params.value.trim())
  comment: string;

  @ApiProperty({
    example: 123,
    description: 'ID of the product being reviewed',
  })
  @IsNotEmpty()
  product: number;
}
