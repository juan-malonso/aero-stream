import { AeroStreamEngine } from 'aero-stream-engine';

// Obteniendo las variables de entorno desde el entorno del Pilot
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3000';
const ENGINE_SECRET = process.env.ENGINE_SECRET || 'default-secret';

const engine = new AeroStreamEngine({
  url: ENGINE_URL,
  secret: ENGINE_SECRET,
});

async function startPilot() {
  await engine.connect();
  console.log(
    '[aero-stream-pilot] Servicio iniciado y motor conectado exitosamente.'
  );
}

startPilot().catch(console.error);
