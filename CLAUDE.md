# CLAUDE.md — Workout Coach (reto NTT DATA)

Instrucciones para asistentes de IA que trabajen en este repositorio.

## Fuente de verdad

1. `docs/CHALLENGE.md` (requisitos oficiales; no modificar).
2. `docs/spec/workout-refactor.md` (spec aprobada). Si un cambio contradice la spec,
   detenerse y proponer actualizar la spec antes de tocar código.

## Stack (no actualizar)

Angular 20.3 · TypeScript 5.9 (strict) · Karma + Jasmine · zone.js 0.15 · ESLint + Prettier.

## Arquitectura: `src/app/features/workout/`

- `domain/`: TypeScript puro (sin `@angular/*`). Modelos, reglas, puertos (`WorkoutRepository`).
- `application/`: casos de uso y estado (signals). Depende solo de `domain`.
- `infrastructure/`: implementa puertos. DTO en `snake_case` y mapper a dominio.
- `presentation/`: container (`WorkoutPageComponent`) + presentacionales sin `inject()`,
  con `input()`/`output()` y `OnPush`. No importa `infrastructure`.
- La inyección de implementaciones (`provide`) se hace en `app.config.ts`.
  Estas reglas se verifican con `npm run lint`.

## Convenciones

- Sin `any`. `inject()` en lugar de constructor. `@if`/`@for`. Signals/`computed()`.
- Limpiar timers y suscripciones (`DestroyRef`).
- Textos de UI en inglés.
- Conventional Commits; un commit por tarea de la spec, con build/test/lint en verde.

## Comandos

`npm start` · `npm run build` · `npm test` · `npm run lint` · `npm run format:check`

## Forma de trabajo

La desarrolladora ejecuta los comandos y valida cada paso. La IA propone y explica;
no modifica archivos sin autorización explícita.
