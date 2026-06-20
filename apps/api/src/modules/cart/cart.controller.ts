import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, CustomerAuth, OptionalCustomerAuth } from '../../common/decorators';
import { AuthUser } from '../../common/types';
import { CartService, CartOwner } from './cart.service';
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './dto/cart.dto';

// Cart works for both guests (x-cart-session header) and logged-in customers.
@OptionalCustomerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private owner(user: AuthUser | undefined, sessionId?: string): CartOwner {
    return user?.id ? { userId: user.id } : { sessionId };
  }

  @Get()
  view(@CurrentUser() user: AuthUser | undefined, @Headers('x-cart-session') sessionId?: string) {
    return this.cartService.view(this.owner(user, sessionId));
  }

  @Post('items')
  add(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: AddCartItemDto,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cartService.addItem(this.owner(user, sessionId), dto);
  }

  @Patch('items/:id')
  update(
    @CurrentUser() user: AuthUser | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cartService.updateItem(this.owner(user, sessionId), id, dto);
  }

  @Delete('items/:id')
  remove(
    @CurrentUser() user: AuthUser | undefined,
    @Param('id') id: string,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cartService.removeItem(this.owner(user, sessionId), id);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser | undefined, @Headers('x-cart-session') sessionId?: string) {
    return this.cartService.clear(this.owner(user, sessionId));
  }
}

// Merge requires a logged-in customer.
@CustomerAuth()
@Controller('cart')
export class CartMergeController {
  constructor(private readonly cartService: CartService) {}

  @Post('merge')
  merge(@CurrentUser('id') userId: string, @Body() dto: MergeCartDto) {
    return this.cartService.merge(userId, dto.sessionId);
  }
}
