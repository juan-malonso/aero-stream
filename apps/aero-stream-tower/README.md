# Aero-Stream Tower

`aero-stream-tower` is the server-side component of the Aero-Stream solution, responsible for managing WebSocket connections and securely routing data between the pilot and the ground station.

## Deployment

To deploy the `aero-stream-tower`, follow these steps:

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Deploy to Cloudflare Workers:**
    ```bash
    npm run deploy
    ```

## Type Generation
To generate or synchronize types based on your Worker configuration, run:
```bash
npm run cf-typegen
```
When instantiating Hono, pass the CloudflareBindings as generics:
```ts
// src/index.ts
import { Hono } from 'hono';

const app = new Hono<{ Bindings: CloudflareBindings }>();
```

## Security

The security of the `aero-stream-tower` is ensured through a ticket-based authentication system that prevents unauthorized access and replay attacks.

### Ticket-Based Authentication

1. **Ticket Request:** The pilot requests a ticket from the `/request-flight` endpoint. This ticket is a unique, single-use token required to establish a WebSocket connection.

2. **Nonce and Hashing:** Each ticket is generated using a nonce (`uuidv4`) and a timestamp, which are combined with a secret key and then hashed using SHA-256. This ensures that each ticket is unique and unpredictable.

3. **Cache to Prevent Replay Attacks:** To prevent replay attacks, each generated ticket is stored in a cache (`TICKET_CACHE`) with its timestamp. When the pilot attempts to connect, the tower validates the ticket against the cache:
    - It checks if the ticket exists in the cache.
    - It verifies that the ticket has not expired (the default expiration time is 60 seconds).
    - Once the ticket is used, it is deleted from the cache, making it invalid for future connection attempts.

4. **Secure Handshake:** After validating the ticket, the connection is established through a secure handshake using the `tweetnacl` library, which ensures that all communications between the pilot and the tower are encrypted.
