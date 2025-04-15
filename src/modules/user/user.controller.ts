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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account. Requires admin privileges.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to create user' })
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.createUser(createUserDto);
      return createResponse(
        HttpStatus.CREATED,
        'User created successfully',
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
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieves a list of all users. Requires authentication.',
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve users' })
  async findAll() {
    try {
      const users = await this.userService.findAllUsers();
      return createResponse(
        HttpStatus.OK,
        'Users retrieved successfully',
        users,
      );
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('showMe')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'Current user profile',
    type: UserResponseDto,
  })
  showCurrentUser(@CurrentUser() user: ITokenUser) {
    return createResponse(
      HttpStatus.OK,
      'User profile retrieved successfully',
      user,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'User found successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to retrieve user' })
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
        ...userDetail
      } = user;
      return createResponse(
        HttpStatus.OK,
        'User retrieved successfully',
        userDetail,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update user',
    description:
      'Updates user information. Users can only update their own profile unless they are admins.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Failed to update user' })
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
        ...userDetail
      } = user;
      return createResponse(
        HttpStatus.OK,
        'User updated successfully',
        userDetail,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
