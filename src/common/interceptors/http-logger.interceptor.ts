import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { sanitizeLog } from 'src/common/utils/sanitize-log.util';
import { AppLoggerService } from 'src/modules/logger/logger.service';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl, body, params, query } = request;
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip;
    const startTime = Date.now();

    const safeBody = sanitizeLog(body);
    const safeParams = sanitizeLog(params);
    const safeQuery = sanitizeLog(query);

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;

        this.logger.log(
          `[${method}] ${originalUrl} ${response.statusCode} - ${responseTime}ms`,
          'HttpLogger',
        );

        this.logger.debug(
          {
            body: safeBody,
            params: safeParams,
            query: safeQuery,
            userAgent,
            ip,
          },
          'HttpRequest',
        );

        // Optional: Sanitize response data too
        // this.logger.debug(sanitizeLogData(data), 'HttpResponse');
      }),
    );
  }
}
