/**
 * Welcome to the Aero-Stream Pilot Worker.
 *
 * This worker acts as a secure WebSocket-to-TCP proxy.
 * - It accepts WebSocket connections from a frontend client.
 * - It validates a Pre-Shared Key (PSK) sent as a URL query parameter.
 * - It establishes a raw TCP connection to a backend service.
 * - It then pipes all data between the client and the backend.
 */

import { connect } from 'cloudflare:sockets';

interface Environment {
  /** The secret key that clients must provide to connect. */
  SECRET_PSK: string;
  /** The address and port of the backend TCP service (e.g., "backend.example.com:8080"). */
  BACKEND_HOST_PORT: string;
}

export default {
  async fetch(
    request: Request,
    env: Environment,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // 1. Validate the Pre-Shared Key (PSK) from the query string.
    const clientToken = url.searchParams.get('token');
    if (clientToken !== env.SECRET_PSK) {
      return new Response('Invalid authentication token', { status: 403 });
    }

    // 2. Ensure the request is a WebSocket upgrade request.
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected a WebSocket upgrade request', {
        status: 426,
      });
    }

    // 3. Establish the WebSocket connection with the client and the TCP socket with the backend.
    const { clientWs, serverWs, tcpSocket } = await setupConnections(env);

    // 4. Pipe the streams. This is the core of the "pipe" or "tunnel".
    // We don't need to wait for these promises to resolve before returning the response.
    // `waitUntil` ensures the work continues after the response is sent.
    ctx.waitUntil(pipeStreams(serverWs, tcpSocket));

    // Return the response that completes the WebSocket handshake.
    // This gives the client one end of the WebSocket pair.
    return new Response(null, {
      status: 101,
      webSocket: clientWs,
    });
  },
};

/**
 * Creates the WebSocket pair and connects to the backend TCP socket.
 * @param env The worker's environment variables.
 */
async function setupConnections(env: Environment) {
  // Create a WebSocket pair: one end for the client, one for us to control.
  const { 0: clientWs, 1: serverWs } = new WebSocketPair();

  // Connect to the backend TCP service.
  const tcpSocket = await connect({
    hostname: env.BACKEND_HOST_PORT.split(':')[0],
    port: parseInt(env.BACKEND_HOST_PORT.split(':')[1], 10),
  });

  return { clientWs, serverWs, tcpSocket };
}

/**
 * Pipes data in both directions between the WebSocket and the TCP socket.
 * Handles graceful closure and errors.
 * @param webSocket The server-side of the WebSocket connection.
 * @param tcpSocket The backend TCP socket.
 */
async function pipeStreams(webSocket: WebSocket, tcpSocket: Socket) {
  let hasClosed = false;
  const writer = tcpSocket.writable.getWriter();

  // Function to gracefully close both connections.
  const closeConnections = () => {
    if (hasClosed) return;
    hasClosed = true;
    try {
      writer.close();
      webSocket.close();
      tcpSocket.close();
    } catch (err) {
      console.error(`Error while closing connections: ${err}`);
    }
  };

  // Listen for messages from the client WebSocket.
  webSocket.addEventListener('message', (event) => {
    // The specific message to intercept and log, as requested.
    if (event.data === 'hello back im front') {
      console.log('Intercepted client hello:', event.data);
    }
    // Forward the message to the backend TCP socket.
    writer.write(event.data);
  });

  // Listen for data from the backend TCP socket.
  tcpSocket.readable
    .pipeTo(
      new WritableStream({
        write(chunk) {
          // Forward the data to the client WebSocket.
          webSocket.send(chunk);
        },
      })
    )
    .catch((err) => {
      console.error(`TCP readable stream error: ${err}`);
      closeConnections();
    });

  // Listen for close events to clean up.
  webSocket.addEventListener('close', closeConnections);
  webSocket.addEventListener('error', (err) => {
    console.error('WebSocket error event:', err);
    closeConnections();
  });
  tcpSocket.closed.catch((err) => {
    console.error(`TCP socket closed with error: ${err}`);
    closeConnections();
  });
}
