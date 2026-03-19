
import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin: string | undefined, c: any) => {
    
    const allowedOrigins = (c.env?.ALLOWED_ORIGINS || '').split(',');
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }
    
    return null; // Block if it doesn't match
  },

  allowMethods: ['GET', 'POST', 'OPTIONS'],
})