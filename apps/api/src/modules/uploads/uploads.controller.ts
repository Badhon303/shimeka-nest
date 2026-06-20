import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AdminAuth, CustomerAuth } from '../../common/decorators';
import { STORAGE_PROVIDER, StorageProvider } from './storage.interface';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('uploads')
export class UploadsController {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  // Admin single-image upload (products, categories, banners).
  @AdminAuth()
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    this.validate(file);
    return this.storage.save(
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      folder ?? 'products',
    );
  }

  // Admin multi-image upload.
  @AdminAuth()
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    return Promise.all(
      files.map((file) => {
        this.validate(file);
        return this.storage.save(
          { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
          folder ?? 'products',
        );
      }),
    );
  }

  // Customer review photo upload.
  @CustomerAuth()
  @Post('review-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReviewImage(@UploadedFile() file: Express.Multer.File) {
    this.validate(file);
    return this.storage.save(
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      'reviews',
    );
  }

  private validate(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File exceeds 5 MB limit');
    }
  }
}
