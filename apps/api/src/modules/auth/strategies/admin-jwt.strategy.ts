import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@shimeka/shared';
import { AppConfig } from '../../../config/configuration';
import { AuthUser, JwtPayload } from '../../../common/types';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.adminAccessSecret', { infer: true }),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.ctx !== 'admin') {
      throw new UnauthorizedException('Invalid token context');
    }
    if (payload.role !== UserRole.ADMIN && payload.role !== UserRole.STAFF) {
      throw new UnauthorizedException('Not an admin account');
    }
    return { id: payload.sub, role: payload.role, ctx: payload.ctx };
  }
}
