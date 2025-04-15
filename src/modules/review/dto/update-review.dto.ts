// import { OmitType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/swagger';
import { CreateReviewDto } from 'src/modules/review/dto/create-review.dto';

export class UpdateReviewDto extends OmitType(CreateReviewDto, ['product']) {}
