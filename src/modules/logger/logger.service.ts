import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  /**
   * To get log from file:
   * Get-Content .\logs\combined.log -Wait (for window)(-wait:“Keep watching this file and show me new lines as they’re written — live.”)
   * tail -f logs/combined.log (for lunix)
   */
  constructor(private readonly pinoLogger: PinoLogger) {}

  setContext(context: string) {
    this.pinoLogger.setContext(context);
  }

  log(message: any, context?: string) {
    this.pinoLogger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string) {
    this.pinoLogger.error({ context, trace }, message);
  }

  warn(message: any, context?: string) {
    this.pinoLogger.warn({ context }, message);
  }

  debug?(message: any, context?: string) {
    this.pinoLogger.debug({ context }, message);
  }

  verbose?(message: any, context?: string) {
    this.pinoLogger.debug({ context }, message); // verbose logs are treated as debug
  }
}
