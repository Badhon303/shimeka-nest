import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@shimeka/shared';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfig } from '../../config/configuration';
import { JwtPayload, TokenContext } from '../../common/types';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // ---- Customer registration ----
  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (existing) {
      throw new ConflictException('An account with this email or phone already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        name: dto.name ?? null,
        passwordHash,
        role: UserRole.CUSTOMER,
      },
    });

    const tokens = await this.issueTokens(user.id, user.role, 'customer');
    return { user: this.sanitize(user), ...tokens };
  }

  // ---- Login (customer or admin context) ----
  async login(dto: LoginDto, context: TokenContext) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { phone: dto.identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('This account has been blocked');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Admin context login must be ADMIN or STAFF.
    if (context === 'admin' && user.role === UserRole.CUSTOMER) {
      throw new UnauthorizedException('Not authorized for admin access');
    }
    // Customer context login must be a CUSTOMER.
    if (context === 'customer' && user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Please use the admin login');
    }

    const tokens = await this.issueTokens(user.id, user.role, context);
    return { user: this.sanitize(user), ...tokens };
  }

  // ---- Refresh tokens (rotation) ----
  async refresh(refreshToken: string, context: TokenContext) {
    const secret =
      context === 'admin'
        ? this.config.get('jwt.adminRefreshSecret', { infer: true })
        : this.config.get('jwt.customerRefreshSecret', { infer: true });

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.ctx !== context) {
      throw new UnauthorizedException('Token context mismatch');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash, context, revokedAt: null },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Rotate: revoke the used token.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isBlocked) {
      throw new UnauthorizedException('Account unavailable');
    }

    return this.issueTokens(user.id, user.role, context);
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  // ---- Helpers ----
  private async issueTokens(userId: string, role: UserRole, context: TokenContext) {
    const accessSecret =
      context === 'admin'
        ? this.config.get('jwt.adminAccessSecret', { infer: true })
        : this.config.get('jwt.customerAccessSecret', { infer: true });
    const refreshSecret =
      context === 'admin'
        ? this.config.get('jwt.adminRefreshSecret', { infer: true })
        : this.config.get('jwt.customerRefreshSecret', { infer: true });
    const accessTtl = this.config.get('jwt.accessTtl', { infer: true });
    const refreshTtl = this.config.get('jwt.refreshTtl', { infer: true });

    const basePayload: JwtPayload = { sub: userId, role, ctx: context };

    const accessToken = await this.jwt.signAsync(
      { ...basePayload, typ: 'access', jti: randomUUID() },
      { secret: accessSecret, expiresIn: accessTtl },
    );
    const refreshToken = await this.jwt.signAsync(
      { ...basePayload, typ: 'refresh', jti: randomUUID() },
      { secret: refreshSecret, expiresIn: refreshTtl },
    );

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        context,
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    // Deterministic hash so we can look up stored refresh tokens.
    // (argon2 is non-deterministic; use sha256 for lookup.)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createHash } = require('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitize(user: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    role: UserRole;
    isBlocked: boolean;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
