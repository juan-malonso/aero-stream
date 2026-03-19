export interface MultipartUpload {
  uploadId: string;
  key: string;
}

export interface UploadedPart {
  partNumber: number;
  etag: string;
}

export interface StoragePort {
  upload(key: string, data: ArrayBuffer | string | Uint8Array): Promise<void>;
  download(key: string): Promise<ArrayBuffer | string | null>;
  createMultipartUpload(key: string, contentType: string): Promise<MultipartUpload>;
  uploadPart(upload: MultipartUpload, partNumber: number, data: ArrayBuffer): Promise<UploadedPart>;
  completeMultipartUpload(upload: MultipartUpload, parts: UploadedPart[]): Promise<void>;
  abortMultipartUpload(upload: MultipartUpload): Promise<void>;
}