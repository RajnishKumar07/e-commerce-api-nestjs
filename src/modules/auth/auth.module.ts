import { Module } from '@nestjs/common';
import { EmailService } from 'src/shared/services/email.service';
import { HandleJwtService } from 'src/shared/services/jwt.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UserModule], // Import UserModule to access UserService
  providers: [AuthService, EmailService, HandleJwtService],
  controllers: [AuthController],
})
export class AuthModule {}
