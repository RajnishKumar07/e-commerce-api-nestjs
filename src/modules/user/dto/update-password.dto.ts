import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Enter old password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  oldPassword: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description:
      'User password (6-50 chars, at least 1 uppercase, 1 lowercase, 1 number)',
    minLength: 6,
    maxLength: 50,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\W]{6,50}$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{6,50}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  newPassword: string;
}
