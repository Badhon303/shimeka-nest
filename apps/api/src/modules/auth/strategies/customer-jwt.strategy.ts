import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../../config/configuration';
import { AuthUser, JwtPayload } from '../../../common/types';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt.customerAccessSecret', { infer: true }),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.ctx !== 'customer') {
      throw new UnauthorizedException('Invalid token context');
    }
    return { id: payload.sub, role: payload.role, ctx: payload.ctx };
  }
}
