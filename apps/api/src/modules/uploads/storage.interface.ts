export interface StoredFile {
  // Public URL to access the file.
  url: string;
  // Storage key/path (relative) — useful for deletion.
  key: string;
}

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

// Storage abstraction so we can swap local disk for S3/R2 later
// without touching business logic. Inject via STORAGE_PROVIDER token.
export interface StorageProvider {
  save(input: UploadInput, folder?: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
