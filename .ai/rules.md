# Reglas para Agentes de IA (.ai/rules.md)

Este documento define las reglas de comportamiento y el proceso de trabajo para los agentes de IA que operan en este repositorio, específicamente en la implementación de la arquitectura Server-Driven UI (Tower-Pilot-Example).

## 1. Proceso de Trabajo Basado en Tareas

*   **Identificación:** Antes de realizar cualquier cambio, el agente debe revisar la carpeta `.ai/tasks/` para identificar tareas en estado `[TODO]` o `[IN_PROGRESS]`.
*   **Asignación:** Para comenzar a trabajar en una tarea, el agente debe cambiar el estado del archivo de la tarea a `[IN_PROGRESS]` y anotar su inicio.
*   **Ejecución:** El agente debe seguir estrictamente los criterios de aceptación (Acceptance Criteria) definidos en el archivo de la tarea y en `.ai/plan.md`.
*   **Finalización:** Una vez completada y verificada la tarea, el agente debe:
    1. Asegurarse de que el código compila, los tests pasan y sigue las convenciones del repositorio.
    2. Cambiar el estado de la tarea a `[DONE]`.
    3. (Opcional, según preferencia del usuario): Eliminar o archivar el archivo de la tarea para mantener la carpeta limpia.

## 2. Convenciones de Código y Estilo

*   **TypeScript:** Uso estricto de TypeScript (`strict: true`). No usar `any` a menos que sea absolutamente inevitable y documentado.
*   **Arquitectura:** Respetar la división en módulos (`aero-stream-tower`, `aero-stream-pilot`, `aero-stream-pilot-example`). No acoplar lógicamente el backend con el frontend.
*   **Validación:** Ningún cambio debe darse por terminado sin validación empírica (ej. correr scripts de build, linter, tests locales).
*   **Mensajes Clásicos:** Para commit messages o reportes, priorizar el "por qué" sobre el "qué".

## 3. Restricciones del Sistema

*   No modificar secretos ni variables de entorno sensibles en archivos versionados.
*   No comprometer (`git commit`) cambios a menos que el usuario lo solicite explícitamente.
*   Siempre usar las herramientas de CLI (`pnpm`, `npm`, `yarn` según corresponda al monorepo) para la gestión de dependencias. (Nota: el repo usa `yarn` y `Taskfile.yml`).

## 4. Contexto y Planificación

*   Si hay dudas sobre la arquitectura, consultar `.ai/context.md`.
*   Para ver el mapa general de progreso, consultar `.ai/plan.md`.
