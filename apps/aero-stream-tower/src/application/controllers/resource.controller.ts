import type {
  AppContext,
  GeneratePresignedUrlUseCase,
  StoragePort
} from '@/domain';
import { Logger } from '@/utils';

export interface StorageResource {
  body?: ArrayBuffer | ReadableStream | string;
  httpMetadata?: { contentType?: string };
  size?: number;
}

function isStorageResource(resource: unknown): resource is StorageResource {
  return typeof resource === 'object' && resource !== null;
}

function isValidBody(value: unknown): value is ArrayBuffer | ReadableStream | string {
  return (
    typeof value === 'string' ||
    value instanceof ReadableStream ||
    value instanceof ArrayBuffer
  );
}

export class ResourceController {
  private readonly logger = new Logger('ResourceController');

  constructor(
    private readonly generatePresignedUrlUseCase: GeneratePresignedUrlUseCase,
    private readonly storageAdapter: StoragePort
  ) { }

  private determineContentType(resourceId?: string): string {
    if (!resourceId) return 'application/octet-stream';
    if (resourceId.endsWith('.json')) return 'application/json';
    if (resourceId.endsWith('.webm')) return 'video/webm';
    if (resourceId.endsWith('.vtt')) return 'text/vtt';
    return 'application/octet-stream';
  }

  private extractStreamData(resource: unknown) {
    let stream: ArrayBuffer | ReadableStream | string | null = null;
    let contentType: string | undefined;
    let size: number | undefined;

    if (isStorageResource(resource)) {
      if (resource.body && isValidBody(resource.body)) stream = resource.body;
      contentType = resource.httpMetadata?.contentType;
      size = resource.size;
    }

    if (!stream && isValidBody(resource)) {
      stream = resource;
    }
    return { stream, contentType, size };
  }

  private buildHeaders(resourceId: string, contentType?: string, size?: number): Record<string, string> {
    const headers: Record<string, string> = {
      ['Content-Type']: contentType ?? this.determineContentType(resourceId),
    };

    if (size) {
      headers['Content-Length'] = size.toString();
    }
    return headers;
  }

  async getPresignedUrl(c: AppContext) {
    const sessionId = c.req.param('sessionId');
    const resourceId = c.req.param('resourceId');
    const origin = new URL(c.req.url).origin;

    if (!sessionId || !resourceId) {
      this.logger.warn('Missing session or resource ID', { sessionId, resourceId });
      return c.text('Missing session or resource ID', 400);
    }

    const url = await this.generatePresignedUrlUseCase.execute(
      origin,
      sessionId,
      resourceId,
      c
    );

    this.logger.info('Presigned URL generated', { sessionId, resourceId, origin });
    return c.json({ url });
  }

  async downloadResource(c: AppContext) {
    const sessionId = c.req.param('sessionId');
    const resourceId = c.req.param('resourceId');
    const expires = c.req.query('expires');
    const signature = c.req.query('signature');
    const path = new URL(c.req.url).pathname;

    if (!sessionId || !resourceId || !expires || !signature) {
      this.logger.warn('Missing parameters', { sessionId, resourceId });
      return c.text('Missing parameters', 400);
    }

    const isValid = await this.generatePresignedUrlUseCase.verify(
      path,
      expires,
      signature,
      c
    );

    if (!isValid) {
      this.logger.warn('Invalid or expired signature', { sessionId, resourceId });
      return c.text('Invalid or expired signature', 403);
    }

    const key = `${sessionId}/${resourceId}`;
    this.logger.debug('Fetching from storage', { key });
    
    const resource = await this.storageAdapter.download(key);
    if (!resource) {
      this.logger.error('Resource not found in storage', { key });
      return c.text(`Storage object not found for key: ${key}`, 404);
    }

    // 1. Safe extraction of the stream (Supports Cloudflare R2 objects or Fetch API Response)
    const { stream, contentType, size } = this.extractStreamData(resource);

    if (!stream) {
      this.logger.error('Failed to extract stream from resource', { key });
      return c.text('Failed to extract stream from resource', 500);
    }

    // 2. Configure essential headers for video downloads
    const headers = this.buildHeaders(resourceId, contentType, size);
    
    return c.body(stream, 200, headers);
  }
}