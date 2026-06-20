import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UserRole } from '@shimeka/shared';
import { AdminAuth } from '../../common/decorators';
import { ContentService } from './content.service';
import {
  CreateBannerDto,
  SetContentDto,
  UpdateBannerDto,
} from './dto/content.dto';

// Public content endpoints.
@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('banners')
  banners() {
    return this.contentService.activeBanners();
  }

  @Get('content/:key')
  content(@Param('key') key: string) {
    return this.contentService.getContent(key);
  }
}

@AdminAuth(UserRole.ADMIN)
@Controller('admin')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('banners')
  listBanners() {
    return this.contentService.listBanners();
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.contentService.createBanner(dto);
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.contentService.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.contentService.deleteBanner(id);
  }

  @Get('content')
  listContent() {
    return this.contentService.listContent();
  }

  @Put('content/:key')
  setContent(@Param('key') key: string, @Body() dto: SetContentDto) {
    return this.contentService.setContent(key, dto.value);
  }
}
