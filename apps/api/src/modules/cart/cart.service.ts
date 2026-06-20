import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartView } from '@shimeka/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

const CART_ITEM_INCLUDE = {
  items: {
    include: {
      productVariant: {
        include: {
          product: { select: { id: true, name: true, slug: true, thumbnailImage: true } },
          attributeValues: { include: { variantAttribute: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

export interface CartOwner {
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(owner: CartOwner) {
    if (!owner.userId && !owner.sessionId) {
      throw new BadRequestException('A cart session id or login is required');
    }
    const where = owner.userId ? { userId: owner.userId } : { sessionId: owner.sessionId };
    let cart = await this.prisma.cart.findFirst({ where, include: CART_ITEM_INCLUDE });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: owner.userId ?? null, sessionId: owner.sessionId ?? null },
        include: CART_ITEM_INCLUDE,
      });
    }
    return cart;
  }

  async view(owner: CartOwner): Promise<CartView> {
    const cart = await this.getOrCreateCart(owner);
    return this.serialize(cart);
  }

  async addItem(owner: CartOwner, dto: AddCartItemDto): Promise<CartView> {
    const cart = await this.getOrCreateCart(owner);
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.productVariantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: dto.productVariantId,
        },
      },
    });
    const newQty = (existing?.quantity ?? 0) + dto.quantity;
    if (newQty > variant.stockQuantity) {
      throw new BadRequestException('Not enough stock available');
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productVariantId: dto.productVariantId, quantity: dto.quantity },
      });
    }
    return this.view(owner);
  }

  async updateItem(owner: CartOwner, itemId: string, dto: UpdateCartItemDto): Promise<CartView> {
    const cart = await this.getOrCreateCart(owner);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { productVariant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      if (dto.quantity > item.productVariant.stockQuantity) {
        throw new BadRequestException('Not enough stock available');
      }
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    }
    return this.view(owner);
  }

  async removeItem(owner: CartOwner, itemId: string): Promise<CartView> {
    const cart = await this.getOrCreateCart(owner);
    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    return this.view(owner);
  }

  async clear(owner: CartOwner): Promise<CartView> {
    const cart = await this.getOrCreateCart(owner);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.view(owner);
  }

  // Merge a guest cart (by sessionId) into the logged-in user's cart.
  async merge(userId: string, sessionId: string): Promise<CartView> {
    const guestCart = await this.prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true },
    });
    const userCart = await this.getOrCreateCart({ userId });

    if (guestCart && guestCart.id !== userCart.id) {
      for (const item of guestCart.items) {
        const existing = await this.prisma.cartItem.findUnique({
          where: {
            cartId_productVariantId: {
              cartId: userCart.id,
              productVariantId: item.productVariantId,
            },
          },
        });
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
        });
        const maxQty = variant?.stockQuantity ?? 0;
        const combined = Math.min((existing?.quantity ?? 0) + item.quantity, maxQty);
        if (combined <= 0) continue;
        if (existing) {
          await this.prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: combined },
          });
        } else {
          await this.prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productVariantId: item.productVariantId,
              quantity: combined,
            },
          });
        }
      }
      await this.prisma.cart.delete({ where: { id: guestCart.id } });
    }
    return this.view({ userId });
  }

  private serialize(cart: any): CartView {
    const items = (cart.items ?? []).map((item: any) => {
      const variant = item.productVariant;
      const label = (variant.attributeValues ?? [])
        .map((av: any) => `${av.variantAttribute?.name}: ${av.value}`)
        .join(', ');
      return {
        id: item.id,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        productId: variant.product.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantLabel: label,
        unitPrice: Number(variant.price),
        image: variant.images?.[0] ?? variant.product.thumbnailImage ?? null,
        stockQuantity: variant.stockQuantity,
      };
    });
    const subtotal = items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
    const itemCount = items.reduce((s: number, i: any) => s + i.quantity, 0);
    return { id: cart.id, items, subtotal, itemCount };
  }
}
