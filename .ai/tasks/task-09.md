# Task 09: Pruebas E2E del Sistema Completo (.ai/tasks/task-09.md)

**Status:** `[TODO]`
**Task ID:** `task-09`
**Title:** Pruebas E2E locales del flujo Server-Driven UI

## Descripción
Verificar que el sistema completo (Tower + Pilot + Example) funciona correctamente de forma integrada. Probar la persistencia de sesión al recargar la página y la correcta transición de pantallas dictada por D1.

## Contexto Relevante
- Todos los servicios ejecutándose localmente (`task dev` o equivalente).

## Criterios de Aceptación
- [ ] El backend Tower inicia y conecta con la base de datos D1 local (con datos de prueba precargados).
- [ ] La app cliente conecta por WebSocket y renderiza correctamente la primera pantalla enviada por Tower.
- [ ] Al hacer clic en un botón (`commit`), el backend procesa la acción y el frontend transiciona a la siguiente pantalla sin recargar.
- [ ] Al recargar el navegador a mitad del flujo, el frontend debe volver a la misma pantalla en la que estaba, comprobando la persistencia en el Durable Object.

## Notas del Agente
[El agente llenará esto cuando asuma la tarea]
