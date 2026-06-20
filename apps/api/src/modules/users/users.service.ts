import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@shimeka/shared';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPaginated,
  getPaginationParams,
  PaginationQueryDto,
} from '../../common/pagination';
import {
  AddressDto,
  ChangePasswordDto,
  CreateStaffDto,
  UpdateProfileDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (exists) throw new ConflictException('Email already in use');
    }
    if (dto.phone) {
      const exists = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id: userId } },
      });
      if (exists) throw new ConflictException('Phone already in use');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email: dto.email, phone: dto.phone },
    });
    return this.sanitize(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new NotFoundException('User not found');
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    // Revoke all refresh tokens after password change.
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  // ---- Addresses ----
  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: AddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async updateAddress(userId: string, id: string, dto: AddressDto) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    await this.prisma.address.delete({ where: { id } });
    return { success: true };
  }

  // ---- Admin: customers ----
  async listCustomers(query: PaginationQueryDto & { search?: string }) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    const where: any = { role: UserRole.CUSTOMER };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return buildPaginated(
      rows.map((u) => ({ ...this.sanitize(u), orderCount: u._count.orders })),
      total,
      page,
      pageSize,
    );
  }

  async getCustomer(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 20 },
        addresses: true,
      },
    });
    if (!user) throw new NotFoundException('Customer not found');
    return { ...this.sanitize(user), orders: user.orders, addresses: user.addresses };
  }

  async setBlockStatus(id: string, isBlocked: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBlocked },
    });
    return this.sanitize(updated);
  }

  // ---- Admin: staff ----
  listStaff() {
    return this.prisma.user
      .findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.STAFF] } },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((u) => this.sanitize(u)));
  }

  async createStaff(dto: CreateStaffDto) {
    if (dto.role === UserRole.CUSTOMER) {
      throw new BadRequestException('Staff role must be ADMIN or STAFF');
    }
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, dto.phone ? { phone: dto.phone } : undefined].filter(Boolean) as any },
    });
    if (exists) throw new ConflictException('Account already exists');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone ?? null,
        name: dto.name,
        passwordHash,
        role: dto.role,
      },
    });
    return this.sanitize(user);
  }

  async deleteStaff(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff not found');
    if (user.role === UserRole.CUSTOMER) {
      throw new BadRequestException('Not a staff account');
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
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
