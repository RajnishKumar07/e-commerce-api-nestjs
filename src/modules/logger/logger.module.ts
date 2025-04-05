import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpLoggerInterceptor } from 'src/common/interceptors/http-logger.interceptor';
import { AppLoggerService } from 'src/modules/logger/logger.service';

@Global() // Makes the logger globally available (no need to import in every module)
@Module({
  providers: [
    AppLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggerInterceptor,
    },
  ],
  exports: [AppLoggerService],
})
export class AppLoggerModule {}
