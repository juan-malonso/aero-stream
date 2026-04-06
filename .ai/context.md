# Contexto de la Arquitectura (.ai/context.md)

## Visión General: Tower-Pilot-Example

El sistema implementa un patrón **Server-Driven UI (SDUI)** combinado con **Máquinas de Estado (State Machines)** y **Cloudflare Workflows**. Esto permite definir flujos complejos donde el backend controla las reglas de negocio y la navegación, mientras que el frontend actúa como un motor de renderizado inteligente.

### Módulos Principales

1.  **Tower (Backend):**
    *   **Tecnología:** Cloudflare Worker, Hono, Durable Objects (DO), D1, Cloudflare Workflows.
    *   **Rol:** El "Cerebro" y Orquestador.
    *   **Responsabilidades:**
        *   Mantener el WebSocket actual para sincronización general.
        *   Delegar **únicamente** los eventos relacionados con los "steps" (pasos del flujo) a un nuevo módulo de **Orquestación/State Machine** (implementado vía Durable Objects).
        *   Consultar D1 para evaluar la lógica de transición y decidir el siguiente paso.
        *   Conectarse con **Cloudflare Workflows** para manejar procesos asíncronos de larga duración o lógica de negocio compleja que ocurra entre pasos.

2.  **Pilot (Frontend Library):**
    *   **Ubicación:** `apps/aero-stream-pilot`
    *   **Tecnología:** Librería TypeScript + React.
    *   **Rol:** El "Motor de Navegación".
    *   **Responsabilidades:**
        *   Implementar un nuevo módulo (ej. `src/core/workflow` o `src/core/steps`) similar al módulo existente de `video`.
        *   Gestionar el registro de la librería de componentes visuales.
        *   Manejar el ciclo de renderizado: determinar qué paso se abre a continuación basado en los eventos del backend, y renderizar el componente adecuado.
        *   Tomar el control total del proceso hasta que el flujo finalice.

3.  **Example (Frontend App):**
    *   **Ubicación:** `apps/aero-stream-pilot-example`
    *   **Tecnología:** Next.js (React).
    *   **Rol:** La "Implementación".
    *   **Responsabilidades:**
        *   Definir los componentes React reales para cada paso.
        *   Inicializar el módulo de `steps` del Pilot, pasándole la librería de componentes.
        *   Dejarse llevar: ceder el control del renderizado del flujo al Pilot.

## Flujo de Datos

1.  **Inicialización:** Example inicializa Pilot con la librería de componentes. Pilot inicia el flujo renderizando su contenedor.
2.  **Conexión:** Pilot usa el WebSocket existente para enviar un evento de inicio de flujo.
3.  **Orquestación en Tower:** El WebSocket de Tower detecta el evento de "step" y lo deriva al módulo de Orquestación (Durable Object).
4.  **Renderizado:** Tower envía el estado actual (ej. `RENDER_STEP`). Pilot lo recibe, busca el componente en la librería y lo renderiza automáticamente.
5.  **Interacción:** El usuario interactúa. El componente llama a la API inyectada por Pilot. Pilot envía el evento de paso al Tower.
6.  **Transición & Workflows:** El módulo de Orquestación evalúa D1, posiblemente dispara un **Cloudflare Workflow**, y emite el siguiente `RENDER_STEP`.
7.  **Finalización:** Cuando el flujo termina, Pilot desmonta el proceso de steps y devuelve el control (si aplica).
