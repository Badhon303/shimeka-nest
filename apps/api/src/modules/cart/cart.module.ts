import { Module } from '@nestjs/common';
import { CartController, CartMergeController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  controllers: [CartController, CartMergeController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
