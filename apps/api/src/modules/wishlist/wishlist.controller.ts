import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, CustomerAuth } from '../../common/decorators';
import { WishlistService } from './wishlist.service';

@CustomerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.wishlistService.list(userId);
  }

  @Post()
  add(@CurrentUser('id') userId: string, @Body('productId') productId: string) {
    return this.wishlistService.add(userId, productId);
  }

  @Delete(':productId')
  remove(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.remove(userId, productId);
  }
}
