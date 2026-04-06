# Task 02: Crear Módulo de Orquestación `StateMachineInstance` (.ai/tasks/task-02.md)

**Status:** `[TODO]`
**Task ID:** `task-02`
**Title:** Crear el módulo StateMachineInstance (Durable Object)

## Descripción
Implementar el Durable Object que funcionará como la Máquina de Estado. Mantendrá el estado actual del flujo del usuario y manejará la lógica de qué paso sigue.

## Contexto Relevante
- Archivo de entrada: `apps/aero-stream-tower/src/domain/models/state-machine.do.ts` (o similar en el nuevo módulo de orquestación).

## Criterios de Aceptación
- [ ] El binding del Durable Object está configurado en `wrangler.jsonc`.
- [ ] La clase `StateMachineInstance` persiste y recupera `currentStepId` desde `this.ctx.storage`.
- [ ] Implementa un método para recibir eventos de "paso" y procesar transiciones consultando la base de datos D1.

## Notas del Agente
[El agente llenará esto cuando asuma la tarea]
