import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductFilterDto } from './dto/products.dto';

// Public product browsing, detail, search, related.
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() filter: ProductFilterDto) {
    return this.productsService.listPublic(filter);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.productsService.search(q ?? '');
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':slug/related')
  related(@Param('slug') slug: string) {
    return this.productsService.related(slug);
  }
}
