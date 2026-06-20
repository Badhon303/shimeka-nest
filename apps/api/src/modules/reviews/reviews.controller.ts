import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReviewStatus, UserRole } from '@shimeka/shared';
import { AdminAuth, CurrentUser, CustomerAuth } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/pagination';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ModerateReviewDto } from './dto/reviews.dto';

// Public: read approved reviews for a product.
@Controller('products/:productId/reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  list(@Param('productId') productId: string, @Query() query: PaginationQueryDto) {
    return this.reviewsService.listForProduct(productId, query);
  }
}

// Customer: write / list own reviews.
@CustomerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get('mine')
  listMine(@CurrentUser('id') userId: string) {
    return this.reviewsService.listMine(userId);
  }
}

// Admin: moderation.
@AdminAuth(UserRole.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto & { status?: ReviewStatus }) {
    return this.reviewsService.listAll(query);
  }

  @Patch(':id/moderate')
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderate(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
