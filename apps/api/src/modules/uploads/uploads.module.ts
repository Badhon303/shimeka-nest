import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER } from './storage.interface';
import { UploadsController } from './uploads.controller';

// To add S3/R2 later: implement StorageProvider in an s3-storage.provider.ts
// and switch on config.uploads.driver here. Business logic stays unchanged.
@Module({
  controllers: [UploadsController],
  providers: [
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService<AppConfig, true>, local: LocalStorageProvider) => {
        const driver = config.get('uploads.driver', { infer: true });
        switch (driver) {
          case 'local':
          default:
            return local;
        }
      },
      inject: [ConfigService, LocalStorageProvider],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class UploadsModule {}
