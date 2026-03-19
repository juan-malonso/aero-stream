import { v4 as uuidv4 } from 'uuid';

import { TICKET_EXPIRATION_MS } from '@/constants';

export class RequestFlightUseCase {
  async execute(secretTokenKey: string): Promise<{ ticket: string; timestamp: number; expires: number }> {
    const timestamp = Date.now();
    const nonce = uuidv4();
    const encoder = new TextEncoder();
    const data = encoder.encode(`${timestamp}-${nonce}-${secretTokenKey}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const ticket = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return { ticket, timestamp, expires: timestamp + TICKET_EXPIRATION_MS };
  }
}