import { UserRole } from '@shimeka/shared';

export type TokenContext = 'customer' | 'admin';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  ctx: TokenContext;
  // token type to distinguish access vs refresh when needed
  typ?: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  role: UserRole;
  ctx: TokenContext;
}

// Express request augmented with the authenticated user (set by passport strategies).
export interface RequestWithUser extends Request {
  user: AuthUser;
}
