import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user']; // May be undefined for public routes

    if (!user) return undefined; // Return undefined if no user is attached

    return data ? user[data as keyof typeof user] : user;
  },
);
