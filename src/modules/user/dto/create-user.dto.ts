import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    minLength: 3,
    maxLength: 50,
    pattern: '^[a-zA-Z ]*$', // Only letters and spaces
  })
  @MaxLength(50)
  @MinLength(3)
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Matches(/^[a-zA-Z ]*$/, {
    message: 'Name can only contain letters and spaces',
  })
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    format: 'email',
    maxLength: 255,
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', // Email regex
  })
  @IsEmail(undefined, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description:
      'User password (6-50 chars, at least 1 uppercase, 1 lowercase, 1 number)',
    minLength: 6,
    maxLength: 50,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\W]{6,50}$',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{6,50}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'User role (automatically assigned if not provided)',
    example: UserRole.USER,
    default: UserRole.USER,
  })
  @IsOptional()
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Email verification token (auto-generated if not provided)',
    example: '650f71b4d9f7b923d6a7c5e9',
    readOnly: true, // Indicates this should not be set by clients
  })
  @IsOptional()
  verificationToken: string;
}
