import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';

    switch (exception.code) {
      case 'P2002':
        status = 409;
        code = 'DUPLICATE_ENTRY';
        message = `Duplicate entry for ${exception.meta?.target}`;
        break;
      case 'P2025':
        status = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
        break;
      case 'P2003':
        status = 400;
        code = 'FOREIGN_KEY_CONSTRAINT';
        message = 'Foreign key constraint failed';
        break;
      default:
        message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
