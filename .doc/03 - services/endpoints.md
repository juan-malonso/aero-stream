# Services, Endpoints, and Security

## Aero-Stream Tower

### Endpoints

The `tower` service exposes a single main endpoint for communication.

- **Endpoint:** `/connect`
- **Method:** `GET` (with `Upgrade: websocket` header)
- **Protocol:** `WSS` (WebSocket Secure)

### Connection Protocol

The connection is initiated as a standard HTTP/S `GET` request which is then "upgraded" to a persistent WebSocket connection.

### Security Mechanisms

1.  **Origin Validation (CORS):**
    - The worker will validate the `Origin` header of the incoming request.
    - Only origins on a predefined whitelist (configurable via Cloudflare environment variables) will be able to establish a connection.
    - Requests from unauthorized origins will be rejected with a `403 Forbidden` status code.

2.  **Encrypted Transport (WSS):**
    - All data transport is done over `WebSocket Secure`, which uses TLS/SSL to encrypt data in transit between the client and Cloudflare.

3.  **Secure Environment Variables:**
    - All sensitive configuration, such as the origin whitelist or potential API keys, will be managed through Cloudflare Secrets and injected into the worker as environment variables.
