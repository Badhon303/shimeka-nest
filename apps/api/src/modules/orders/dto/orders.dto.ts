import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DeliveryStatus,
  PaymentMethod,
  PaymentStatus,
} from '@shimeka/shared';
import { PaginationQueryDto } from '../../../common/pagination';

export class OrderItemInputDto {
  @IsUUID()
  productVariantId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ShippingAddressInputDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  // Either provide a saved address id (logged-in users) or a full address.
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressInputDto)
  shippingAddress?: ShippingAddressInputDto;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  // Shipping zone determines the flat fee (inside_dhaka | outside_dhaka).
  @IsString()
  shippingZone!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  // Guest contact (required when not authenticated).
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;
}

export class OrderFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  deliveryStatus?: DeliveryStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  deliveryStatus!: DeliveryStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class AddOrderNoteDto {
  @IsString()
  @IsNotEmpty()
  note!: string;
}
