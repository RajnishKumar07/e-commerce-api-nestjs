import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsNotEmpty()
  @MaxLength(100)
  @Transform((params) => params.value.trim())
  title: string;

  @IsNotEmpty()
  @Transform((params) => params.value.trim())
  comment: string;

  @IsNotEmpty()
  product: number;
}
