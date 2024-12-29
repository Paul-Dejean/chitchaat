import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      map((data) => {
        const delay = Date.now() - now;
        const { statusCode } = res;
        // Here you might need to stringify the data if it's an object
        const logBody = typeof data === 'object' ? JSON.stringify(data) : data;
        this.logger.log(
          `${method} ${url} ${statusCode} ${delay}ms - Response: ${logBody}`,
        );
        return data;
      }),
      tap(null, (err) => {
        // Log errors if any
        this.logger.error(`Failed to process ${method} ${url}: ${err.message}`);
      }),
    );
  }
}
