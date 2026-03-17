export interface AeroStreamEngineOptions {
  url: string;
  secret: string;
}

export class AeroStreamEngine {
  private url: string;
  private secret: string;
  public ws: WebSocket | null = null;

  constructor({ url, secret }: AeroStreamEngineOptions) {
    this.url = url;
    this.secret = secret;
  }

  async connect(): Promise<boolean> {
    console.log(
      `[aero-stream-engine] Conectando a Aero-Stream Tower en: ${this.url}`
    );

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = new URL(this.url);
        // Aseguramos que se utiliza el protocolo WebSocket
        if (wsUrl.protocol === 'http:') wsUrl.protocol = 'ws:';
        if (wsUrl.protocol === 'https:') wsUrl.protocol = 'wss:';

        // Pasamos el secreto como parámetro para la autenticación
        wsUrl.searchParams.append('token', this.secret);

        this.ws = new WebSocket(wsUrl.toString());

        this.ws.addEventListener('open', () => {
          console.log('[aero-stream-engine] WebSocket conectado exitosamente.');
          resolve(true);
        });

        this.ws.addEventListener('error', (error) => {
          console.error('[aero-stream-engine] Error en el WebSocket:', error);
          reject(error);
        });

        this.ws.addEventListener('close', () => {
          console.log('[aero-stream-engine] Conexión WebSocket cerrada.');
        });
      } catch (error) {
        console.error(
          '[aero-stream-engine] Fallo al inicializar el WebSocket:',
          error
        );
        reject(error);
      }
    });
  }
}
