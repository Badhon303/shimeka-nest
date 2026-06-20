import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductStatus, UserRole } from '@shimeka/shared';
import { AdminAuth, CurrentUser } from '../../common/decorators';
import { ProductsService } from './products.service';
import {
  AdminProductFilterDto,
  CreateProductDto,
  StockAdjustmentDto,
  UpdateProductDto,
} from './dto/products.dto';

@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @AdminAuth()
  @Get()
  list(@Query() filter: AdminProductFilterDto) {
    return this.productsService.listAdmin(filter);
  }

  @AdminAuth()
  @Get('low-stock')
  lowStock() {
    return this.productsService.lowStock();
  }

  @AdminAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findByIdAdmin(id);
  }

  @AdminAuth(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @AdminAuth(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @AdminAuth()
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body('status') status: ProductStatus) {
    return this.productsService.setStatus(id, status);
  }

  @AdminAuth(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Inventory: staff are allowed to adjust stock.
  @AdminAuth()
  @Post('variants/:variantId/stock')
  adjustStock(
    @Param('variantId') variantId: string,
    @Body() dto: StockAdjustmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.productsService.adjustStock(variantId, dto, userId);
  }
}
