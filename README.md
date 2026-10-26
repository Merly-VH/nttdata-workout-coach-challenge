# Workout Coach: reto Frontend NTT DATA

![CI](https://github.com/<tu-usuario>/<repo>/actions/workflows/ci.yml/badge.svg)

Evolución de una aplicación Angular legacy a **Clean Architecture** con separación
**Container / Presentational**, **Angular moderno** (signals, `input()`/`output()`, `@if`/`@for`,
`OnPush`, zoneless) y **entrenamiento completo**: lista de ejercicios con avance automático y estados
_Pending / In progress / Completed_. Desarrollada con **Spec-Driven Development**.

## Requisitos

- Node.js `^20.19.0 || ^22.12.0 || >=24.0.0` (desarrollado con Node 24)
- npm 10+
- Google Chrome (tests con Karma)

No es necesario instalar Angular CLI global: los scripts usan el CLI local (Angular 20.3).

## Ejecución

```bash
npm install
npm start            # http://localhost:4200
```

## Scripts

| Script                            | Descripción                                         |
| --------------------------------- | --------------------------------------------------- |
| `npm run build`                   | Build de producción                                 |
| `npm test`                        | Tests (Karma + Jasmine, abre Chrome)                |
| `npm run test:ci`                 | Tests en Chrome headless                            |
| `npm run test:coverage`           | Tests con cobertura (`coverage/`)                   |
| `npm run lint`                    | ESLint (incluye reglas de dependencias entre capas) |
| `npm run format` / `format:check` | Prettier                                            |

## Documentación

- **Spec (fuente de verdad):** [`docs/spec/workout-refactor.md`](docs/spec/workout-refactor.md):
  contexto, alcance, decisiones, modelo de dominio, flujo de datos, criterios de aceptación,
  evidencias y diseño de microfrontends/NgRx.
- **ADR:** [`docs/adr/ADR-001-zoneless.md`](docs/adr/ADR-001-zoneless.md)
- **Enunciado:** [`docs/CHALLENGE.md`](docs/CHALLENGE.md)

## Arquitectura

```text
src/app/
├─ app.config.ts                 composition root: puerto → adaptador, zoneless
└─ features/workout/
   ├─ domain/                    TypeScript puro: modelos, reglas (funciones puras), puerto WorkoutRepository
   ├─ application/               caso de uso, puerto Ticker, WorkoutSessionStore (signals)
   ├─ infrastructure/            DTO snake_case + mapper, MockWorkoutRepository, IntervalTicker
   └─ presentation/              WorkoutPage (container) + Timer, ExerciseList, ExerciseItem, Toast
```

Reglas de dependencia (verificadas por `npm run lint`): `domain` no importa Angular ni otras capas;
`application` solo depende de `domain`; `presentation` no importa `infrastructure`.

## Calidad

- 53 tests: reglas de dominio (CA-1…CA-12), caso de uso y store con dobles de puertos,
  mapper, `IntervalTicker` con `fakeAsync` estricto, componentes presentacionales e integración del container.
- Lint: 9 errores en el código legacy → 0.
- CI (GitHub Actions): formato, lint, build y tests con cobertura en cada push.

## Punto de partida

La base recibida no compilaba (`index.html` ausente, zone.js no instalado, `@types/jasmine` ausente,
`serve` sin `buildTarget`). Se reparó con cambios mínimos en el commit `fix(build)` antes de evolucionarla.
Detalle en la §1.1 de la spec.

## Uso de IA

Se utilizó Claude como apoyo para el análisis, la redacción de la spec y la propuesta de código.
Todo el código fue revisado, ejecutado y verificado por la autora paso a paso (commits pequeños,
tests y lint en cada uno).

## Autora

Merly Vallejos
