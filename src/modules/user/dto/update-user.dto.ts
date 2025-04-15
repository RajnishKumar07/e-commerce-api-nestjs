import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Jane Smith',
    description: 'Updated user name',
    minLength: 3,
    maxLength: 50,
    pattern: '^[a-zA-Z ]*$',
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z ]*$/, {
    message: 'Name can only contain letters and spaces',
  })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'jane.smith@example.com',
    description: 'Updated email address',
    format: 'email',
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
    required: false,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'NewSecurePassword123!',
    description:
      'New password (optional, 6-50 chars with 1 uppercase, 1 lowercase, 1 number)',
    minLength: 6,
    maxLength: 50,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\W]{6,50}$',
    required: false,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(50, { message: 'Password cannot exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{6,50}$/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, and 1 number',
  })
  @IsOptional()
  password?: string;
}
