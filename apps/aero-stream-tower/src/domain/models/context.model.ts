import { type R2Bucket } from '@cloudflare/workers-types';
import { type Context, Hono } from 'hono';

export interface Bindings {
  ['MEDIA_BUCKET']: R2Bucket;
  ['MEDIA_BUCKET_NAME']: string;

  ['ALLOWED_ORIGINS']?: string;

  // AWS
  ['ACCOUNT_ID']: string;
  ['ACCESS_KEY_ID']: string;
  ['SECRET_ACCESS_KEY']: string;
  
  ['ENVIRONMENT']: 'development' | 'production';
  ['SECRET_TOKEN_KEY']?: string;
}

export interface Variables {
  secretToken: string;
}

export interface AppEnv {
  ['Bindings']: Bindings;
  ['Variables']: Variables;
}

export type AppContext = Context<AppEnv>;
export class AppRouter extends Hono<AppEnv> {}

export interface WsConnection {
  send(data: ArrayBuffer | Uint8Array | string): void;
  close(code?: number, reason?: string): void;
}