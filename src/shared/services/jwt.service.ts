import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Response } from 'express';

@Injectable()
export class HandleJwtService {
  constructor(
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async createJWT(payload: any) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }

  async isTokenValid(token: string) {
    return await this.jwtService.verifyAsync(token);
  }

  async attachCookiesToResponse(res: Response, user) {
    const token = await this.createJWT(user);
    const oneDay = 1000 * 60 * 60 * 24;
    const cookieConfig: CookieOptions =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? {
            httpOnly: true,
            expires: new Date(Date.now() + oneDay),
            signed: true,
            secure: true,
            sameSite: 'none',
            domain: 'e-commerce-api-yyqb.onrender.com',
          }
        : {
            httpOnly: true,
            domain: 'localhost',
            expires: new Date(Date.now() + oneDay),
            secure: false,
            sameSite: 'lax',
            signed: true,
          };

    console.log('token------------->', token);
    await res.cookie('token', token, cookieConfig);
  }
}
