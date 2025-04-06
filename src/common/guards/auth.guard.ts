import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC } from 'src/common/decorators/is-public.decorator';
import { HandleJwtService } from 'src/shared/services/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: HandleJwtService, // Inject HandleJwtService
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<string[]>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();

    const { token } = request.signedCookies;

    if (!token) {
      if (isPublic) {
        return true;
      }
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
