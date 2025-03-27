import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // Create a new user
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.createUser(createUserDto);
      return createResponse(
        HttpStatus.CREATED,
        'User Created successfully',
        user,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      const users = await this.userService.findAllUsers();
      return createResponse(HttpStatus.OK, 'Users found successfully', users);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('showMe')
  showCurrentUser(@CurrentUser() user: ITokenUser) {
    return createResponse(HttpStatus.OK, 'User found successfully!', user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const user = await this.userService.findUserById(+id);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const {
        password,
        passwordToken,
        passwordTokenExpirationDate,
        verificationToken,
        verified,
        isVerified,
        ...userDetail
      } = user;
      return createResponse(
        HttpStatus.OK,
        'User found successfully',
        userDetail,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw custom exceptions
      }
      throw new HttpException(
        'Failed to retrieve user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.updateUser(+id, updateUserDto);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const {
        password,
        passwordToken,
        passwordTokenExpirationDate,
        verificationToken,
        verified,
        isVerified,
        ...userDetail
      } = user;
      return createResponse(
        HttpStatus.OK,
        'User updated successfully',
        userDetail,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // Re-throw custom exceptions
      }

      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
