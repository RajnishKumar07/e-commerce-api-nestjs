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
  @IsString()
  key: string;

  @IsString()
  @IsIn(['asc', 'desc'])
  value: 'asc' | 'desc';
}

export class ListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsNumber()
  limit: number;
}
