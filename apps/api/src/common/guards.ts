import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Requires a valid customer-context access token.
@Injectable()
export class CustomerJwtGuard extends AuthGuard('customer-jwt') {}

// Requires a valid admin-context access token (role checked separately by RolesGuard).
@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {}

// Populates req.user when a valid customer token is present but never rejects.
@Injectable()
export class OptionalCustomerJwtGuard extends AuthGuard('customer-jwt') {
  // Override to swallow auth errors and proceed as a guest.
  handleRequest<TUser = any>(_err: any, user: any): TUser {
    return (user ?? undefined) as TUser;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // ignore — guest access allowed
    }
    return true;
  }
}
