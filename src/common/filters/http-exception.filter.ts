import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLoggerService } from 'src/modules/logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';
    if (exception instanceof HttpException) {
      // console.log('message--->', message);
      message = Array.isArray(message['message'])
        ? message['message'][0]
        : message['message'] || message; // Combine validation error messages into one string
    }
    // ✅ Log the full error
    this.logger.error(
      `[${request.method}] ${request.url} ${status} - ${JSON.stringify(message)}`,
      exception.stack,
      'HttpExceptionFilter',
    );
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
