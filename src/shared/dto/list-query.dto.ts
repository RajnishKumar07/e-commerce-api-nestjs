import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SortOptionDto {
  @ApiProperty({
    description: 'The key by which to sort the data',
    example: 'price',
    type: String,
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'The direction of sorting (ascending or descending)',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsIn(['asc', 'desc'])
  value: 'asc' | 'desc';
}

export class ListQueryDto {
  @ApiPropertyOptional({
    description: 'The search term to filter the data',
    example: 'laptop',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort options to apply to the data',
    type: [SortOptionDto],
    example: [{ key: 'price', value: 'asc' }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    try {
      const parsedValue = JSON.parse(value); // Parse the string into an array of objects
      return parsedValue.map((item) => plainToInstance(SortOptionDto, item)); // Transform each object into a SortOptionDto instance
    } catch (error) {
      return []; // Return an empty array if parsing fails
    }
  })
  @IsArray()
  @Type(() => SortOptionDto)
  @ValidateNested({ each: true })
  sort: SortOptionDto[];

  @ApiPropertyOptional({
    description: 'The page number to fetch',
    example: 1,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'The number of items per page to limit the data',
    example: 10,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsNumber()
  limit: number;
}
