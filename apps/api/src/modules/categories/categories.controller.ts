import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

// Public category browsing.
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  tree() {
    return this.categoriesService.tree();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
