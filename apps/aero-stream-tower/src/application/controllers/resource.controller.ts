import { 
  Context, 
  GeneratePresignedUrlUseCase, 
  StoragePort
} from '@/domain';

export class ResourceController {
  constructor(
    private readonly generatePresignedUrlUseCase: GeneratePresignedUrlUseCase,
    private readonly storageAdapter: StoragePort
  ) {}

  async getPresignedUrl(c: Context) {
    const sessionId = c.req.param('sessionId');
    const resourceId = c.req.param('resourceId');
    
    // Get the origin host to construct the absolute URL
    const origin = new URL(c.req.url).origin;

    const url = await this.generatePresignedUrlUseCase.execute(
      origin,
      sessionId,
      resourceId,
      c.env.SECRET_TOKEN_KEY
    );

    return c.json({ url });
  }

  async downloadResource(c: Context) {
    const sessionId = c.req.param('sessionId');
    const resourceId = c.req.param('resourceId');
    const expires = c.req.query('expires');
    const signature = c.req.query('signature');
    const path = new URL(c.req.url).pathname;

    if (!expires || !signature) {
      return c.text('Missing signature or expiration', 400);
    }

    const isValid = await this.generatePresignedUrlUseCase.verify(path, expires, signature, c.env.SECRET_TOKEN_KEY);
    if (!isValid) return c.text('Invalid or expired signature', 403);

    const key = `resources/${sessionId}/${resourceId}`;
    const resource = await this.storageAdapter.download(key);
    if (!resource) return c.text('Resource not found', 404);

    return c.body(resource as any);
  }
}