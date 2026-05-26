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
    const request = ctx.getRequest<Request>();
    const method = httpAdapter.getRequestMethod(request) as string;
    const url = httpAdapter.getRequestUrl(request) as string;

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as { message?: string };
      message = res.message || exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

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

    let responseBody: any;

    if (
      httpStatus >= HttpStatus.BAD_REQUEST &&
      httpStatus < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      responseBody = {
        status: 'fail',
        data: {
          details: message,
        },
      };
    } else {
      responseBody = {
        status: 'error',
        message: message,
      };
    }

    httpAdapter.reply(ctx.getResponse<Response>(), responseBody, httpStatus);
  }
}
