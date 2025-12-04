import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';

@Injectable()
export class AuthGuard implements CanActivate {
  private authMiddleware = new AuthMiddleware();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    return new Promise((resolve) => {
      this.authMiddleware.use(request, response, (err?: any) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}