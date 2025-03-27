import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { HandleJwtService } from 'src/shared/services/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: HandleJwtService, // Inject HandleJwtService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const { token } = request.signedCookies;

    if (!token) {
      throw new UnauthorizedException('Authentication Invalid');
    }

    try {
      const payload = await this.jwtService.isTokenValid(token);
      request['user'] = payload; // Attach the user info to the request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication Invalid');
    }
  }
}
