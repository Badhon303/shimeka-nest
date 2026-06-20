import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@shimeka/shared';
import { AdminAuth } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/pagination';
import { CreateStaffDto, UpdateUserStatusDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---- Customers (admin + staff) ----
  @AdminAuth()
  @Get('customers')
  listCustomers(@Query() query: PaginationQueryDto & { search?: string }) {
    return this.usersService.listCustomers(query);
  }

  @AdminAuth()
  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.usersService.getCustomer(id);
  }

  @AdminAuth(UserRole.ADMIN)
  @Patch('customers/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.setBlockStatus(id, dto.isBlocked);
  }

  // ---- Staff management (ADMIN only) ----
  @AdminAuth(UserRole.ADMIN)
  @Get('staff')
  listStaff() {
    return this.usersService.listStaff();
  }

  @AdminAuth(UserRole.ADMIN)
  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @AdminAuth(UserRole.ADMIN)
  @Delete('staff/:id')
  deleteStaff(@Param('id') id: string) {
    return this.usersService.deleteStaff(id);
  }
}
