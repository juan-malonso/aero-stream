import { StoragePort, MultipartUpload, UploadedPart } from '@/domain';

export class R2StorageAdapter implements StoragePort {
  constructor(private readonly bucket: any) {}

  async upload(key: string, data: ArrayBuffer | string | Uint8Array): Promise<void> {
    if (this.bucket) await this.bucket.put(key, data);
  }

  async download(key: string): Promise<ArrayBuffer | string | null> {
    if (!this.bucket) return null;
    const object = await this.bucket.get(key);
    return object ? await object.arrayBuffer() : null;
  }

  async createMultipartUpload(key: string, contentType: string): Promise<MultipartUpload> {
    if (!this.bucket) throw new Error('R2 Bucket not configured');
    const upload = await this.bucket.createMultipartUpload(key, {
      httpMetadata: { contentType },
    });
    return { uploadId: upload.uploadId, key: upload.key };
  }

  async uploadPart(upload: MultipartUpload, partNumber: number, data: ArrayBuffer): Promise<UploadedPart> {
    const r2Upload = this.bucket.resumeMultipartUpload(upload.key, upload.uploadId);
    const part = await r2Upload.uploadPart(partNumber, data);
    return { partNumber: part.partNumber, etag: part.etag };
  }

  async completeMultipartUpload(upload: MultipartUpload, parts: UploadedPart[]): Promise<void> {
    const r2Upload = this.bucket.resumeMultipartUpload(upload.key, upload.uploadId);
    await r2Upload.complete(parts);
  }

  async abortMultipartUpload(upload: MultipartUpload): Promise<void> {
    const r2Upload = this.bucket.resumeMultipartUpload(upload.key, upload.uploadId);
    await r2Upload.abort();
  }
}