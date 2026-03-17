# Architecture Diagrams

## Connection Flow Diagram

Below is the general architecture diagram illustrating the interaction between the client, Cloudflare, and the backend (`tower`).

```mermaid
sequenceDiagram
    participant Client (Pilot)
    participant Cloudflare
    participant Tower (Worker)

    Client (Pilot)->>+Cloudflare: Request WebSocket connection (WSS)
    Cloudflare->>+Tower (Worker): Forward connection request
    Note over Tower (Worker): Validate origin and headers
    Tower (Worker)-->>-Cloudflare: Accept connection (HTTP 101)
    Cloudflare-->>-Client (Pilot): Connection established

    loop Bidirectional Communication
        Client (Pilot)<=>>Tower (Worker): Exchange of encrypted messages
    end
```
