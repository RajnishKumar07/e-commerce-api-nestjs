import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Response } from 'express';
import { createTokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { EmailService } from 'src/shared/services/email.service';
import { HandleJwtService } from 'src/shared/services/jwt.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserRole } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtService: HandleJwtService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Registers a new user and sends verification email',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Success! Please check your email to verify account',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to create user',
  })
  async register(
    @Headers('origin') origin: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    try {
      const { email, name, password } = createUserDto;
      const emailAlreadyExist = await this.userService.findUserByEmail(email);
      if (emailAlreadyExist) {
        throw new HttpException('Email Already exist.', HttpStatus.BAD_REQUEST);
      }

      const isFirstAccount = await this.userService.isFirstAccount();
      const role = isFirstAccount ? UserRole.ADMIN : UserRole.USER;

      const verificationToken = crypto.randomBytes(40).toString('hex');

      const user = await this.userService.createUser({
        name,
        email,
        password,
        role,
        verificationToken,
      });

      await this.emailService.sendVerificationEmail(
        name,
        email,
        user.verificationToken,
        origin,
      );

      return createResponse(
        HttpStatus.CREATED,
        'Success! Please check your email to verify account',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Verifies user email using the token sent to their email',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing email or token',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid token or email',
  })
  @ApiResponse({
    status: 500,
    description: 'Verification failed',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    try {
      const { email, verificationToken } = verifyEmailDto;

      if (!email || !verificationToken) {
        throw new HttpException('Verification failed', HttpStatus.BAD_REQUEST);
      }

      await this.userService.verifyEmail(email, verificationToken);
      return createResponse(HttpStatus.OK, 'Email verified successfully!');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user and sets JWT cookie',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    headers: {
      'Set-Cookie': {
        description: 'Sets the auth token cookie',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing email or password',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or email not verified',
  })
  @ApiResponse({
    status: 500,
    description: 'Login failed',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const { email, password } = loginDto;
      if (!email || !password) {
        throw new HttpException(
          'Please provide email and password',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
      }

      const isPasswordMatch = await this.userService.comparePasswords(
        password,
        user.password,
      );

      if (!isPasswordMatch) {
        throw new HttpException('Invalid Credentials', HttpStatus.UNAUTHORIZED);
      }

      if (!user.isVerified) {
        throw new HttpException(
          'Please verify your email',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const tokenUser = createTokenUser(user);
      await this.jwtService.attachCookiesToResponse(response, tokenUser);
      return createResponse(HttpStatus.OK, 'Login successful', {
        user: tokenUser,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out user by expiring JWT cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out',
    headers: {
      'Set-Cookie': {
        description: 'Expires the auth token cookie',
        schema: { type: 'string' },
      },
    },
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });

    return createResponse(HttpStatus.OK, 'User logged out successfully!');
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Sends password reset link to user email',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Reset password email sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or non-existent email',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to send reset email',
  })
  async forgotPassword(
    @Headers('origin') origin: string,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    try {
      const { email } = forgotPasswordDto;
      if (!email) {
        throw new HttpException(
          'Please provide valid email',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw new HttpException(
          'No user found with this email',
          HttpStatus.BAD_REQUEST,
        );
      }

      const passwordToken = crypto.randomBytes(70).toString('hex');
      await this.emailService.sendResetPasswordEmail(
        user.name,
        email,
        passwordToken,
        origin,
      );

      const tenMin = 1000 * 60 * 10;
      const passwordTokenExpirationDate = new Date(Date.now() + tenMin);
      await this.userService.forgetPassword(
        email,
        passwordToken,
        passwordTokenExpirationDate,
      );

      return createResponse(
        HttpStatus.OK,
        'Please check your email for reset password link',
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Failed to send reset email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using the token from email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields or invalid token',
  })
  @ApiResponse({
    status: 500,
    description: 'Password reset failed',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const { email, password, token } = resetPasswordDto;
      if (!email || !token || !password) {
        throw new HttpException(
          'Please provide all values',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.userService.resetPassword(email, token, password);

      return createResponse(HttpStatus.OK, 'Password reset successfully');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Password reset failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
