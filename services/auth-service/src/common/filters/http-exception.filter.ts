import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IApiError } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      if (typeof exceptionResponse === 'object') {
        code = exceptionResponse.code || 'HTTP_ERROR';
        message = exceptionResponse.message || exception.message;
        details = exceptionResponse.details;
      } else {
        message = exceptionResponse;
      }
    }

    const error: IApiError = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      error,
    });
  }
}
