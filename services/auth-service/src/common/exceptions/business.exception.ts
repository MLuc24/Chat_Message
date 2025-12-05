import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}

export class NotFoundException extends BusinessException {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}

export class ValidationException extends BusinessException {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST);
    if (details) {
      this.getResponse()['details'] = details;
    }
  }
}

export class ConflictException extends BusinessException {
  constructor(message: string) {
    super('CONFLICT', message, HttpStatus.CONFLICT);
  }
}
