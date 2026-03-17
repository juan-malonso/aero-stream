import { AeroStreamEngine } from 'aero-stream-engine';

export default {
  async fetch(request, env, ctx) {
    // Obteniendo las variables de entorno desde el objeto env del Worker
    const ENGINE_URL = env.ENGINE_URL || 'http://localhost:8787';
    const ENGINE_SECRET = env.ENGINE_SECRET || 'default-secret';

    const engine = new AeroStreamEngine({
      url: ENGINE_URL,
      secret: ENGINE_SECRET,
    });

    await engine.connect();
    console.log(
      '[aero-stream-pilot] Servicio iniciado y motor conectado exitosamente.'
    );

    return new Response('Aero-Stream Pilot: Motor conectado exitosamente.', {
      status: 200,
    });
  },
};
