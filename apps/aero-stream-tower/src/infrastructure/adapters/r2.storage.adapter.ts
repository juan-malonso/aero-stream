import type { StoragePort } from '@/domain';
import { Logger } from '@/utils';

import { type R2Bucket } from '@cloudflare/workers-types';


export class R2StorageAdapter implements StoragePort {
  private readonly logger = new Logger('R2StorageAdapter');

  constructor(private readonly bucket: R2Bucket) {}

  // Setters

  async upload(key: string, data: ArrayBuffer | Uint8Array | string): Promise<void> {
    await this.bucket.put(key, data);
  }

  // Getters

  async download(key: string): Promise<ArrayBuffer | string | null> {
    const object = await this.bucket.get(key);
    return object ? await object.arrayBuffer() : null;
  }
}