import { StoragePort, MultipartUpload, UploadedPart } from '../ports';

export class VideoService {
  private upload: MultipartUpload | null = null;
  private uploadedParts: UploadedPart[] = [];
  private _isUploading = false;

  constructor(private readonly storagePort: StoragePort) {}

  get isUploading() {
    return this._isUploading;
  }

  async startUpload(fileName: string, mimeType: string): Promise<string> {
    if (this._isUploading) throw new Error('Upload already in progress');
    
    const uploadKey = `videos/${Date.now()}-${fileName}`;
    this.upload = await this.storagePort.createMultipartUpload(uploadKey, mimeType);
    this.uploadedParts = [];
    this._isUploading = true;
    
    return this.upload.uploadId;
  }

  async processChunk(partNumber: number, chunkData: ArrayBuffer): Promise<void> {
    if (!this._isUploading || !this.upload) throw new Error('No upload in progress');
    
    const part = await this.storagePort.uploadPart(this.upload, partNumber, chunkData);
    this.uploadedParts.push(part);
  }

  async completeUpload(): Promise<string> {
    if (!this._isUploading || !this.upload) throw new Error('No active upload to complete');
    
    this.uploadedParts.sort((a, b) => a.partNumber - b.partNumber);
    await this.storagePort.completeMultipartUpload(this.upload, this.uploadedParts);
    
    const key = this.upload.key;
    this.reset();
    return key;
  }

  async abortUpload(): Promise<void> {
    if (this._isUploading && this.upload) {
      await this.storagePort.abortMultipartUpload(this.upload);
      this.reset();
    }
  }

  private reset() {
    this._isUploading = false;
    this.upload = null;
    this.uploadedParts = [];
  }
}