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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtService: HandleJwtService,
  ) {}

  @Post('register')
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

      this.emailService.sendVerificationEmail(
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
      if (error instanceof HttpException) {
        throw error; // Re-throw custom exceptions
      }
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() body: { email: string; verificationToken: string },
  ) {
    try {
      const { email, verificationToken } = body;

      if (!email || !verificationToken) {
        throw new HttpException('Verification failed', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.userService.verifyEmail(email, verificationToken);
      return createResponse(HttpStatus.OK, 'Email verified successfully!');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw custom exceptions
      }
      throw new HttpException(
        'Verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const { email, password } = body;
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
      return createResponse(HttpStatus.OK, 'Login successfully', {
        user: tokenUser,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw custom exceptions
      }
      throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });

    return createResponse(HttpStatus.OK, 'user logged out!');
  }

  @Post('forget-password')
  async forgerPassword(
    @Headers('origin') origin: string,
    @Body() body: Pick<CreateUserDto, 'email'>,
  ) {
    const { email } = body;
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
    this.userService.forgetPassword(
      email,
      passwordToken,
      passwordTokenExpirationDate,
    );

    return createResponse(
      HttpStatus.OK,
      'Please check your email for reset password link',
    );
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; token: string; password: string },
  ) {
    const { email, password, token } = body;
    if (!email || !token || !password) {
      throw new HttpException(
        'Please provide all values',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userService.resetPassword(email, token, password);

    return createResponse(HttpStatus.OK, 'Password reset successfully');
  }
}
