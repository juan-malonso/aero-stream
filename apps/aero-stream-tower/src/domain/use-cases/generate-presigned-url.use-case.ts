import { type AppContext } from "../models";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


export class GeneratePresignedUrlUseCase {
  async execute(
    origin: string,
    sessionId: string,
    resourceId: string,
    c: AppContext
  ): Promise<string> {
    if (c.env.ENVIRONMENT === 'development') {
      const expires = Date.now() + 3600 * 1000; // 1 hora de validez
      const path = `/download/${sessionId}/${resourceId}`;

      // Generate HMAC signature (using SHA-256)
      const encoder = new TextEncoder();
      const data = encoder.encode(`${path}-${String(expires)}-${c.env.SECRET_TOKEN_KEY ?? ''}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const signature = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      return `${origin}${path}?expires=${String(expires)}&signature=${signature}`;
    }

    const fileName = `resources/${sessionId}/${resourceId}`;
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${c.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: c.env.ACCESS_KEY_ID,
        secretAccessKey: c.env.SECRET_ACCESS_KEY,
      },
    });

    const command = new GetObjectCommand({
      ['Bucket']: c.env.MEDIA_BUCKET_NAME,
      ['Key']: fileName,
    });

    // Generar URL válida por 1 hora (3600 seg)
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return url;
  }

  async verify(
    path: string,
    expires: string,
    signature: string,
    c: AppContext
  ): Promise<boolean> {
    if (Date.now() > parseInt(expires, 10)) return false;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${path}-${expires}-${c.env.SECRET_TOKEN_KEY ?? ''}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const expectedSignature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  }
}