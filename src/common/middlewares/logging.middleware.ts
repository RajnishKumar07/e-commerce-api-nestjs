import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: Error | any) => void) {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    res.on('finish', () => {
      console.log(`Outgoing response: ${res.statusCode}`);
    });
    next();
  }
}
