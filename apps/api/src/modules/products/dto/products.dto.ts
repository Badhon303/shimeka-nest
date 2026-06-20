import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductStatus } from '@shimeka/shared';
import { PaginationQueryDto } from '../../../common/pagination';

export class AttributeValueInputDto {
  @IsString()
  @MaxLength(80)
  value!: string;

  @IsOptional()
  @IsString()
  swatchHex?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class AttributeInputDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueInputDto)
  values!: AttributeValueInputDto[];
}

// Reference to an attribute value by attribute name + value (resolved server-side).
export class VariantAttributeRefDto {
  @IsString()
  attributeName!: string;

  @IsString()
  value!: string;
}

export class VariantInputDto {
  @IsString()
  @MaxLength(80)
  sku!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeRefDto)
  attributeValues!: VariantAttributeRefDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsUUID()
  categoryId!: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  thumbnailImage?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeInputDto)
  attributes?: AttributeInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantInputDto)
  variants!: VariantInputDto[];
}

export class UpdateProductDto extends CreateProductDto {}

export class ProductFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string; // category slug

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  attributes?: string; // e.g. "Shade:Ivory,Size:M"

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popularity';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  featured?: boolean;
}

export class AdminProductFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class StockAdjustmentDto {
  @IsInt()
  change!: number;

  @IsString()
  @MaxLength(200)
  reason!: string;
}
