# Task 04: Enrutamiento Selectivo en WebSocket (.ai/tasks/task-04.md)

**Status:** `[DONE]`
**Task ID:** `task-04`
**Title:** Derivar selectivamente eventos de steps desde el WebSocket

## Descripción
El controlador de sincronización actual en Tower (`SyncController`) maneja el WebSocket. Debe modificarse para interceptar los mensajes que corresponden a eventos de "steps" (ej. `type: "STEP_ACTION"`) y delegarlos al Durable Object de la Máquina de Estado, manteniendo los demás eventos intactos.

## Contexto Relevante
- Archivo: `apps/aero-stream-tower/src/application/controllers/sync.controller.ts` u otro manejador de WS.

## Criterios de Aceptación
- [x] El handler de mensajes WebSocket identifica el tipo de mensaje.
- [x] Si es un evento de steps, se envía al Stub del `StateMachineInstance` del usuario.
- [x] Otros eventos siguen su flujo normal sin afectar el State Machine.

## Notas del Agente
- Se modificó `event.model.ts` para agregar `Events.step_action` y `Events.step_render`.
- Se actualizó `AppContext` y `Bindings` para incluir `STATE_MACHINE`.
- Se enrutó `step_action` al Stub del Durable Object en `sync.controller.ts`.
- Se solicitó y envió el paso inicial desde `state-machine` en el handler de `handshakeMessage`.
