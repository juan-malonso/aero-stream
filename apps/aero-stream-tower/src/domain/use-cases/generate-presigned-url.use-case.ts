export class GeneratePresignedUrlUseCase {
  async execute(
    origin: string,
    sessionId: string,
    resourceId: string,
    secretTokenKey: string
  ): Promise<string> {
    const expires = Date.now() + 3600 * 1000; // 1 hora de validez
    const path = `/download/${sessionId}/${resourceId}`;
    
    // Generate HMAC signature (using SHA-256)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${path}-${expires}-${secretTokenKey}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return `${origin}${path}?expires=${expires}&signature=${signature}`;
  }

  async verify(
    path: string,
    expires: string,
    signature: string,
    secretTokenKey: string
  ): Promise<boolean> {
    if (Date.now() > parseInt(expires, 10)) return false;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${path}-${expires}-${secretTokenKey}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const expectedSignature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  }
}