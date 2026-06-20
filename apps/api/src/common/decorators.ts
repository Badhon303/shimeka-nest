import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@shimeka/shared';
import { AdminJwtGuard, CustomerJwtGuard, OptionalCustomerJwtGuard } from './guards';
import { RolesGuard } from './roles.guard';
import { AuthUser } from './types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Extracts the authenticated user from the request.
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);

// Customer-only protected route (requires a valid customer-context JWT).
export const CustomerAuth = () => applyDecorators(UseGuards(CustomerJwtGuard));

// Optional customer auth — populates req.user if a valid token is present, else continues.
export const OptionalCustomerAuth = () =>
  applyDecorators(UseGuards(OptionalCustomerJwtGuard));

// Admin/staff protected route. Pass roles to restrict (defaults to ADMIN + STAFF).
export const AdminAuth = (...roles: UserRole[]) =>
  applyDecorators(
    UseGuards(AdminJwtGuard, RolesGuard),
    Roles(...(roles.length ? roles : [UserRole.ADMIN, UserRole.STAFF])),
  );
