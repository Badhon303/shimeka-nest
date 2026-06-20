import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productVariantId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;
}

export class MergeCartDto {
  @IsString()
  sessionId!: string;
}
