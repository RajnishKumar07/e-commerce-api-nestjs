import { Injectable, NestMiddleware } from '@nestjs/common';
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req, res, next) {
    // Parse the body as raw bytes for Stripe
    // bodyParser.raw({ type: 'application/json' })(req, res, next);
    next();
  }
}
