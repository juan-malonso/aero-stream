export interface StoragePort {
  // Setters
  upload(key: string, data: ArrayBuffer | Uint8Array | string, contentType?: string): Promise<void>;

  // Getters
  download(key: string): Promise<ArrayBuffer | string | null>;
}