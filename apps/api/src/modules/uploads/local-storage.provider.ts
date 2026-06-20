import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { AppConfig } from '../../config/configuration';
import { StorageProvider, StoredFile, UploadInput } from './storage.interface';

// Local-disk implementation. Files are written under UPLOAD_LOCAL_DIR and
// served statically at UPLOAD_PUBLIC_BASE_URL (see main.ts).
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.baseDir = path.resolve(
      process.cwd(),
      this.config.get('uploads.localDir', { infer: true }),
    );
    this.publicBaseUrl = this.config
      .get('uploads.publicBaseUrl', { infer: true })
      .replace(/\/$/, '');
  }

  async save(input: UploadInput, folder = 'misc'): Promise<StoredFile> {
    const ext = path.extname(input.originalName) || this.extFromMime(input.mimeType);
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '');
    const fileName = `${randomUUID()}${ext}`;
    const relKey = path.posix.join(safeFolder, fileName);
    const absPath = path.join(this.baseDir, safeFolder, fileName);

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, input.buffer);

    return { url: `${this.publicBaseUrl}/${relKey}`, key: relKey };
  }

  async delete(key: string): Promise<void> {
    const absPath = path.join(this.baseDir, key);
    try {
      await fs.unlink(absPath);
    } catch {
      // ignore missing files
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/avif': '.avif',
    };
    return map[mime] ?? '';
  }
}
