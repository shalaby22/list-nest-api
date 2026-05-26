import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JSendSuccess } from '../interfaces';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  JSendSuccess<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<JSendSuccess<T>> {
    return next.handle().pipe(
      map((data: T) => {
        return {
          status: 'success',
          data: data,
        };
      }),
    );
  }
}
