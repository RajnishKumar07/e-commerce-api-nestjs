import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UpdatePasswordDto } from 'src/modules/user/dto/update-password.dto';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);

    user.password = await this.hashPassword(user.password);
    return await this.userRepository.save(user);
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findUserById(id: number): Promise<User> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  // Find all users
  async findAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  // Update user details
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.name = updateUserDto.name;
    user.email = updateUserDto.email;

    await this.userRepository.save(user);
    return user;
  }

  async isFirstAccount(): Promise<boolean> {
    return (await this.userRepository.count()) === 0;
  }

  async verifyEmail(email: string, verificationToken: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new HttpException('Verification failed', HttpStatus.UNAUTHORIZED);
    }

    if (user.verificationToken !== verificationToken) {
      throw new HttpException('Verification failed', HttpStatus.UNAUTHORIZED);
    }

    user.isVerified = true;
    user.verificationToken = '';
    user.verified = new Date();

    return this.userRepository.save(user);
  }

  // Compare entered password with the stored hashed password
  async comparePasswords(
    enteredPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, storedPassword);
  }

  async forgetPassword(
    email: string,
    passwordToken: string,
    passwordTokenExpirationDate: Date,
  ): Promise<User> {
    const user = await this.findUserByEmail(email);

    user.passwordToken = passwordToken;
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;

    return await this.userRepository.save(user);
  }

  async resetPassword(
    email: string,
    token: string,
    password: string,
  ): Promise<User> {
    const user = await this.findUserByEmail(email);
    if (!user || user.passwordToken !== token) {
      throw new HttpException(
        'Please provide valid token',
        HttpStatus.BAD_REQUEST,
      );
    }
    const currentDate = new Date();
    if (user.passwordTokenExpirationDate <= currentDate) {
      throw new HttpException('Token has been expired', HttpStatus.BAD_REQUEST);
    }

    user.password = await this.hashPassword(password);
    user.passwordToken = null;
    user.passwordTokenExpirationDate = null;
    return this.userRepository.save(user);
  }

  private async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async updateUserPassword(userId: number, body: UpdatePasswordDto) {
    const { newPassword, oldPassword } = body;

    const user = await this.findUserById(userId);

    const isPasswordMatch = await this.comparePasswords(
      oldPassword,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid credential');
    }

    user.password = await this.hashPassword(newPassword);

    return this.userRepository.save(user);
  }
}
