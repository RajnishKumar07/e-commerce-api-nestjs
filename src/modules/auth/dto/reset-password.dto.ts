import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'reset-token' })
  token: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'newpassword123' })
  password: string;
}
