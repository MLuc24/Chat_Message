import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
