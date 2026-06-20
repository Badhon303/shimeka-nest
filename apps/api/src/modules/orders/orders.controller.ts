import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  CustomerAuth,
  OptionalCustomerAuth,
} from '../../common/decorators';
import { AuthUser } from '../../common/types';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderFilterDto } from './dto/orders.dto';

// Order creation supports both guests and logged-in customers.
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @OptionalCustomerAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(@CurrentUser() user: AuthUser | undefined, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, user?.id);
  }

  // Guest order lookup by order number + phone/email.
  @Get('lookup')
  lookup(@Query('orderNumber') orderNumber: string, @Query('contact') contact: string) {
    return this.ordersService.lookupGuest(orderNumber, contact);
  }

  @CustomerAuth()
  @Get('mine')
  listMine(@CurrentUser('id') userId: string, @Query() query: OrderFilterDto) {
    return this.ordersService.listMine(userId, query);
  }

  @CustomerAuth()
  @Get('mine/:orderNumber')
  getMine(@CurrentUser('id') userId: string, @Param('orderNumber') orderNumber: string) {
    return this.ordersService.getMine(userId, orderNumber);
  }
}
