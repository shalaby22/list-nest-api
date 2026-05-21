import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus: HttpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as { message?: string | string[] };
      message = Array.isArray(res.message)
        ? res.message.join(', ')
        : res.message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    const request = ctx.getRequest<Request>();
    const method = httpAdapter.getRequestMethod(request) as string;
    const url = httpAdapter.getRequestUrl(request) as string;

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      const error = exception as Error;
      message = 'Internal Server Error';
      this.logger.error(
        `[500 Internal Error] ${method} ${url} | Message: ${message}`,
        error.stack,
      );
    } else if (httpStatus === HttpStatus.TOO_MANY_REQUESTS) {
      this.logger.warn(
        `[RateLimit ${httpStatus}] ${method} ${url} | Message: ${message}`,
      );
    }

    const responseBody = {
      statusCode: httpStatus,
      path: url,
      message: message,
    };

    httpAdapter.reply(ctx.getResponse<Response>(), responseBody, httpStatus);
  }
}
