# Spec — Workout Coach: refactor a Clean Architecture y entrenamiento completo

| Campo                | Valor                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Estado               | Aprobada (v1)                                                         |
| Autora               | Merly Vallejos                                                        |
| Fuente de requisitos | `docs/CHALLENGE.md`, instrucciones del candidato (PDF)                |
| Stack                | Angular 20.3 · TypeScript 5.9 strict · Karma + Jasmine · zone.js 0.15 |

## 1. Contexto y problema

La aplicación funciona con un único ejercicio, pero es legacy:

- Toda la lógica (temporizador, transiciones, estado) vive en `WorkoutTimerComponent`.
- Uso de `any` en el servicio y el componente; estado mutable; `setInterval` imperativo sin limpieza al destruir.
- Inyección por constructor, `*ngIf`/`ngClass`, sin `OnPush`.
- El servicio devuelve el DTO externo (`snake_case`) directamente a la vista.

### 1.1 Hallazgos de línea base

La base recibida no compilaba ni arrancaba. Se reparó con cambios mínimos (commit `fix(build)`):

| #   | Síntoma                                   | Causa                                             | Arreglo                          |
| --- | ----------------------------------------- | ------------------------------------------------- | -------------------------------- |
| B1  | `ng build`: no encuentra `src/index.html` | Archivo ausente                                   | Crear `index.html`               |
| B2  | Runtime `NG0908`                          | Angular 20 requiere zone.js y no estaba instalado | `zone.js@~0.15.0` + polyfills    |
| B3  | Tests no compilan                         | Falta `@types/jasmine`                            | Instalar `@types/jasmine@~5.1.0` |
| B4  | `ng serve` sin `buildTarget`              | Falta `defaultConfiguration`                      | Añadirla en `serve`              |

Estado inicial de lint (`npm run lint`): **9 errores** (3 `no-explicit-any`, 1 `prefer-inject`,
2 `prefer-on-push-component-change-detection`, 3 `prefer-control-flow`).

### 1.2 Comportamiento legacy que se preserva

- Una fase de N segundos dura N ticks de 1 s; al llegar a 0 se cambia de fase en el mismo tick.
- Ejercicio → descanso → (repetición +1) → ejercicio …, incluido el descanso tras la última repetición.
- Pausar detiene el tiempo conservando fase y segundos; Iniciar reanuda.
- Reiniciar vuelve al estado inicial.
- Textos en inglés: `Rest time`, `Back to exercise`, `Workout completed`.

## 2. Alcance

**Dentro:**

- Reorganizar la feature en `domain` / `application` / `infrastructure` / `presentation`.
- Puerto `WorkoutRepository` + adaptador mock que devuelve una **lista** de ejercicios (DTO `snake_case`).
- Sesión completa: avance automático entre ejercicios y estados Pending / In progress / Completed.
- Container / Presentational con `input()`, `output()` y `OnPush`.
- Angular moderno: signals, `computed()`, `inject()`, `@if`/`@for`, sin `any`, limpieza de timers.
- Tests de dominio, casos de uso, infraestructura y al menos un componente presentacional.
- Migración final a zoneless (ver ADR-001).
- Diseño (no implementación) de microfrontends y NgRx (§10).

**Fuera:**

- Backend o HTTP real, persistencia, autenticación, routing.
- Edición de ejercicios por el usuario, sonidos, i18n.
- Implementar Native/Module Federation o NgRx.
- Actualizar Angular u otras dependencias.

## 3. Decisiones

| ID  | Decisión                                                                                                                           | Motivo                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | zone.js en la línea base; zoneless al final                                                                                        | Preservar el legacy (muta campos sin signals) hasta que todo el estado sea signals                                                                                            |
| D2  | Mantener Karma + Jasmine                                                                                                           | Tooling del proyecto; no se cambia sin necesidad                                                                                                                              |
| D3  | El repositorio devuelve `Observable`                                                                                               | Simula una fuente asíncrona (HTTP) y permite probar el camino de error                                                                                                        |
| D4  | El puerto del dominio usa solo `import type { Observable } from 'rxjs'`                                                            | El CHALLENGE ubica el puerto en `domain`; rxjs es una librería de tipos, no el framework. La regla de lint prohíbe `@angular/*` en `domain`. Trade-off aceptado y documentado |
| D5  | Descanso también tras la última repetición de cada ejercicio                                                                       | Comportamiento legacy y criterio "al terminar descanso se incrementa la repetición"                                                                                           |
| D6  | Textos de UI en inglés; estados mostrados como `Pending` / `In progress` / `Completed`                                             | Coherencia con el legacy                                                                                                                                                      |
| D7  | Estado de sesión explícito: `idle`, `running`, `paused`, `finished`                                                                | Distinguir "no iniciada" de "pausada" (Start inicia o reanuda)                                                                                                                |
| D8  | Al finalizar, el contador muestra `00:00` y Start queda deshabilitado                                                              | Corrige un defecto legacy: tras terminar, Start volvía a correr la sesión con el contador fuera de rango                                                                      |
| D9  | El tiempo se abstrae con un puerto `Ticker` (application)                                                                          | La lógica es testeable sin reloj real; solo el adaptador usa `interval`                                                                                                       |
| D10 | Formato `mm:ss`                                                                                                                    | El legacy concatenaba `00:` y fallaba con 60 s o más                                                                                                                          |
| D11 | ESLint impone las reglas de capas (`no-restricted-imports`)                                                                        | Las reglas del §3 se verifican automáticamente                                                                                                                                |
| D12 | En estado de error se muestra un botón _Retry_ que vuelve a llamar a `load()`                                                      | Recuperación del error de carga (CA-9) sin recargar la página                                                                                                                 |
| D13 | Accesibilidad básica: toast con `role="status"` + `aria-live`, ejercicio activo con `aria-current="step"`, botones `type="button"` | Mejora de bajo coste; no es requisito oficial                                                                                                                                 |

## 4. Diseño: capas y reglas de dependencia

```text
src/app/features/workout/
├─ domain/           TypeScript puro (sin @angular/*)
│  ├─ models/        exercise.ts, workout-session.ts, workout-event.ts
│  ├─ rules/         workout-session.rules.ts (+ .spec.ts)
│  ├─ errors/        invalid-workout.error.ts
│  └─ ports/         workout.repository.ts
├─ application/      depende solo de domain
│  ├─ ports/         ticker.ts
│  ├─ use-cases/     load-workout.use-case.ts (+ .spec.ts)
│  └─ state/         workout-session.store.ts (+ .spec.ts)
├─ infrastructure/   implementa puertos
│  ├─ dto/           exercise.dto.ts
│  ├─ mappers/       exercise.mapper.ts (+ .spec.ts)
│  ├─ repositories/  mock-workout.repository.ts
│  └─ time/          interval-ticker.ts (+ .spec.ts)
└─ presentation/     consume application/domain; nunca infrastructure
   ├─ pages/workout-page/        WorkoutPageComponent (container)
   ├─ components/workout-timer/  WorkoutTimerComponent
   ├─ components/exercise-list/  ExerciseListComponent
   ├─ components/exercise-item/  ExerciseItemComponent (+ .spec.ts)
   ├─ components/workout-toast/  WorkoutToastComponent
   └─ utils/format-seconds.ts    (+ .spec.ts)
   └─ utils/notification-message.ts (+ .spec.ts)
```

Composition root: `src/app/app.config.ts` enlaza puertos con adaptadores
(`{ provide: WorkoutRepository, useClass: MockWorkoutRepository }`,
`{ provide: Ticker, useClass: IntervalTicker }`). `presentation` nunca importa `infrastructure`.

Se elimina el código legacy (`components/workout-timer`, `services/workout.service.ts`) al
completar la migración.

## 5. Modelo de dominio y contratos

```ts
// domain/models
export interface Exercise {
  readonly id: number;
  readonly name: string;
  readonly repetitions: number; // entero >= 1
  readonly repetitionSeconds: number; // entero >= 1
  readonly restSeconds: number; // entero >= 1
}

export type ExerciseStatus = 'pending' | 'in-progress' | 'completed';

export interface ExerciseProgress {
  readonly exercise: Exercise;
  readonly status: ExerciseStatus;
  readonly completedRepetitions: number;
}

export type Phase = 'exercise' | 'rest';
export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface WorkoutSession {
  readonly exercises: readonly ExerciseProgress[];
  readonly currentIndex: number; // ejercicio activo (0 en idle)
  readonly phase: Phase;
  readonly remainingSeconds: number;
  readonly status: SessionStatus;
}

export type WorkoutEvent =
  | { readonly type: 'rest-started' }
  | { readonly type: 'repetition-started' }
  | { readonly type: 'exercise-started'; readonly exerciseName: string }
  | { readonly type: 'workout-completed' };

export interface TickResult {
  readonly session: WorkoutSession;
  readonly event: WorkoutEvent | null;
}
```

```ts
// domain/rules: funciones puras, nunca mutan la entrada
createSession(exercises: readonly Exercise[]): WorkoutSession // lanza InvalidWorkoutError si la lista está vacía
start(session): WorkoutSession   // idle → running (activa el 1.º); paused → running; otros: sin cambios
pause(session): WorkoutSession   // running → paused; otros: sin cambios
reset(session): WorkoutSession   // estado inicial a partir de los mismos ejercicios
tick(session): TickResult        // solo actúa si status === 'running'
createExercise(data): Exercise   // valida invariantes; lanza InvalidWorkoutError
```

```ts
// domain/ports/workout.repository.ts
import type { Observable } from 'rxjs';
export abstract class WorkoutRepository {
  abstract getExercises(): Observable<readonly Exercise[]>;
}

// application/ports/ticker.ts
export abstract class Ticker {
  abstract ticks(): Observable<void>; // emite cada segundo mientras haya suscripción
}
```

```ts
// infrastructure/dto/exercise.dto.ts (contrato externo, snake_case)
export interface ExerciseDto {
  id: number;
  exercise_name: string;
  repetitions_number: number;
  repetition_time: number;
  rest_time: number;
}
```

Mock (`MockWorkoutRepository`): `of([...])` con 3 ejercicios: Squats (3 × 5 s, descanso 3 s),
Push-ups (2 × 4 s, 2 s), Lunges (2 × 4 s, 2 s).

### 5.1 Reglas de transición de `tick` (status = running)

1. `remainingSeconds - 1`. Si sigue > 0 → mismo estado, evento `null`.
2. Si llega a 0 en fase `exercise` → fase `rest`, `remainingSeconds = restSeconds`, evento `rest-started`.
3. Si llega a 0 en fase `rest` → `completedRepetitions + 1`:
   - Si quedan repeticiones → fase `exercise`, `remainingSeconds = repetitionSeconds`, evento `repetition-started`.
   - Si no quedan y hay siguiente ejercicio → actual `completed`, siguiente `in-progress`,
     fase `exercise`, evento `exercise-started`.
   - Si no quedan y es el último → actual `completed`, `status = finished`, `remainingSeconds = 0`,
     evento `workout-completed`.

## 6. Flujo de datos

```text
[MockWorkoutRepository] --Observable<ExerciseDto[]>--> mapper --> Exercise[]
        │ (implementa WorkoutRepository)
        ▼
LoadWorkoutUseCase ──> createSession() ──> WorkoutSessionStore (signals)
                                              ▲      │ computed(): currentExercise, canStart, canPause…
            Ticker.ticks() ── cada 1 s ── tick()      ▼
                                       WorkoutPageComponent (container)
                                         │ inputs ↓        ↑ outputs (start/pause/reset)
                    WorkoutTimer · ExerciseList → ExerciseItem · WorkoutToast
```

- `WorkoutSessionStore` (application) se provee en el container (`providers`), así que su vida
  coincide con la página. Expone `viewState` (`loading` | `ready` | `error`), `session`, `notification`
  como signals de solo lectura y los métodos `load()`, `start()`, `pause()`, `reset()`.
- `start()` se suscribe a `Ticker.ticks()`; `pause()`, `reset()`, `finished` y `DestroyRef` cancelan la suscripción.
- El container traduce `WorkoutEvent` a texto (`Rest time`, `Back to exercise`,
  `Next exercise: <name>`, `Workout completed`).
- Los presentacionales no inyectan dependencias; solo `input()` y `output()`, con `OnPush`.

## 7. Workstreams / plan de implementación

| #   | Tarea                                                                | Commit                         | Hecho cuando                                               |
| --- | -------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| W1  | Modelos, errores y reglas de dominio + tests                         | `feat(domain): …`              | Tests verdes; CA-1…CA-7 cubiertos en dominio               |
| W2  | Puerto `Ticker`, `LoadWorkoutUseCase`, `WorkoutSessionStore` + tests | `feat(application): …`         | Tests con dobles (repo y ticker falsos)                    |
| W3  | DTO, mapper, repositorio mock, `IntervalTicker` + tests              | `feat(infrastructure): …`      | Mapper y ticker probados                                   |
| W4  | Componentes, container, `app.config.ts`; eliminar legacy             | `refactor(presentation): …`    | Test de componente verde; prueba manual OK; lint 0 errores |
| W5  | Zoneless (ADR-001)                                                   | `refactor: …` / `docs(adr): …` | App y tests funcionan sin zone.js en la app                |
| W6  | README, evidencias, CI con lint bloqueante                           | `docs: …` / `ci: …`            | Sección 9 completa                                         |

## 8. Criterios de aceptación

**Funcionales (CHALLENGE §5):**

| ID   | Criterio                                                                          | Prueba          |
| ---- | --------------------------------------------------------------------------------- | --------------- |
| CA-1 | Al cargar, todos los ejercicios están `pending` y la sesión no inicia sola        | dominio + store |
| CA-2 | Iniciar activa el primer ejercicio con su `repetitionSeconds`                     | dominio         |
| CA-3 | Al llegar a cero se inicia descanso con `restSeconds`                             | dominio         |
| CA-4 | Al terminar descanso se incrementa la repetición completada                       | dominio         |
| CA-5 | Al completar repeticiones, el ejercicio pasa a `completed` y arranca el siguiente | dominio         |
| CA-6 | Al completar el último ejercicio, la sesión queda `finished`                      | dominio + store |
| CA-7 | Pausar conserva el progreso; Reiniciar vuelve al estado inicial                   | dominio + store |

**Bordes y errores:**

| ID    | Criterio                                                                           | Prueba                  |
| ----- | ---------------------------------------------------------------------------------- | ----------------------- |
| CA-8  | Lista vacía → `viewState = error` con mensaje                                      | use case / store        |
| CA-9  | Error del repositorio → `viewState = error`                                        | store                   |
| CA-10 | Datos inválidos (repeticiones o tiempos < 1, nombre vacío) → `InvalidWorkoutError` | dominio / mapper        |
| CA-11 | Start con sesión `running` o `finished` no hace nada; Pause en `idle` no hace nada | dominio                 |
| CA-12 | `tick` ignorado si no está `running`                                               | dominio                 |
| CA-13 | No quedan timers activos tras pause/reset/fin/destroy                              | store + interval-ticker |

**De arquitectura y calidad:**

| ID    | Criterio                                      | Verificación                             |
| ----- | --------------------------------------------- | ---------------------------------------- |
| CA-A1 | Cuatro capas con dependencias correctas       | `npm run lint` (`no-restricted-imports`) |
| CA-A2 | Sin `any`; `inject()`; `@if`/`@for`; `OnPush` | `npm run lint` = 0 errores               |
| CA-A3 | DTO `snake_case` solo en infrastructure       | revisión + test del mapper               |
| CA-A4 | Build, tests y formato en verde               | CI (GitHub Actions)                      |

## 9. Evidencias de validación

Entorno: Windows · Node 24.19.0 · npm 11.17.0 · Chrome · Angular CLI 20.3 (local).

| Verificación | Comando                 | Resultado                                                               |
| ------------ | ----------------------- | ----------------------------------------------------------------------- |
| Build        | `npm run build`         | `Application bundle generation complete`; sin `polyfills.js` (zoneless) |
| Tests        | `npm run test:coverage` | `TOTAL: … SUCCESS`                                                      |
| Cobertura    | `npm run test:coverage` | Statements …% · Branches …% · Functions …% · Lines …%                   |
| Lint         | `npm run lint`          | Inicial: 9 errores (legacy) → final: `All files pass linting.`          |
| Formato      | `npm run format:check`  | `All matched files use Prettier code style!`                            |
| CI           | GitHub Actions          | … (enlace a la ejecución en verde)                                      |

### Prueba manual (navegador)

| CA   | Observado                                                                              |
| ---- | -------------------------------------------------------------------------------------- |
| CA-1 | Al cargar: 3 ejercicios _Pending_, `00:05`, sesión sin iniciar                         |
| CA-2 | Start: Squats _In progress_, cuenta atrás desde `00:05`                                |
| CA-3 | A los 5 s: fase _Rest_, `00:03`, toast "Rest time"                                     |
| CA-4 | Tras el descanso: "Completed repetitions: 1 / 3", toast "Back to exercise"             |
| CA-5 | ~24 s: Squats _Completed_, Push-ups _In progress_, toast "Next exercise: Push-ups"     |
| CA-6 | ~48 s: _Finished_, `00:00`, todo _Completed_, "Workout completed", Start deshabilitado |
| CA-7 | Pause detiene y conserva el tiempo; Start reanuda; Reset vuelve a CA-1                 |

### Trazabilidad criterio → prueba automatizada

| Criterio                           | Archivo(s) de test                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| CA-1…CA-7, CA-10…CA-12             | `domain/rules/workout-session.rules.spec.ts`                                      |
| CA-1, CA-8, CA-9                   | `application/use-cases/load-workout.use-case.spec.ts`                             |
| CA-1…CA-3, CA-6…CA-9, CA-11, CA-13 | `application/state/workout-session.store.spec.ts`                                 |
| CA-10, CA-A3                       | `infrastructure/mappers/exercise.mapper.spec.ts`                                  |
| CA-13                              | `infrastructure/time/interval-ticker.spec.ts` (`fakeAsync` con `flush: false`)    |
| CA-1…CA-7, CA-9 (DOM)              | `presentation/pages/workout-page/workout-page.spec.ts`                            |
| Componente presentacional (§7)     | `workout-timer.spec.ts`, `exercise-item.spec.ts`                                  |
| CA-A1, CA-A2                       | `npm run lint` (`no-restricted-imports`, `no-explicit-any`, OnPush, control flow) |
| CA-A4                              | Workflow `.github/workflows/ci.yml`                                               |

## 10. Extensión técnica: microfrontends y NgRx (diseño, no implementación)

**Shell / Host:** aplicación contenedora con layout, navegación, autenticación y carga de remotes
por ruta. **Remote:** `workout` expone sus rutas (`WorkoutPageComponent`); otros dominios
(planes, historial) serían remotes independientes, cada uno con su equipo y su pipeline.

**Estrategia:** Native Federation (`@angular-architects/native-federation`), porque el proyecto usa
el builder `@angular/build` (esbuild); Module Federation clásico depende de webpack.
El shell carga un manifiesto con las URLs de los remotes, de modo que se despliegan sin recompilar el shell.

**Shared dependencies:** `@angular/core`, `@angular/common`, `@angular/router` y `rxjs` como
singleton con versión estricta, para evitar varias instancias de Angular. Una librería compartida
para contratos (tipos) y design system.

**Estado:** la sesión de entrenamiento es **local** del remote (`WorkoutSessionStore`) y no se
comparte. Solo se comparte estado transversal (usuario, token, preferencias) que provee el shell,
mediante un servicio de una librería compartida o eventos del navegador. Los remotes no leen el
estado interno de otros.

**Cuándo usar NgRx:** cuando varias features o remotes leen y modifican el mismo estado, hay flujos
asíncronos complejos, se necesita trazabilidad o DevTools, o hay varios equipos sobre un mismo store.
Aquí no: el estado es local, pequeño y lo resuelven los signals. Correspondencia si se adoptara:

| Pieza NgRx | Equivalente en esta solución                                                      |
| ---------- | --------------------------------------------------------------------------------- |
| Actions    | `start`, `pause`, `reset`, `tick`, `workoutLoaded`, `workoutLoadFailed`           |
| Reducer    | Las funciones puras del dominio (`start`, `pause`, `reset`, `tick`)               |
| Effects    | Carga vía `WorkoutRepository` y suscripción a `Ticker` (`switchMap` a `interval`) |
| Selectors  | Los `computed()` del store (`currentExercise`, `canStart`, progreso)              |
| Store      | `WorkoutSessionStore`                                                             |

Alternativa intermedia: NgRx SignalStore (`withState`, `withComputed`, `withMethods`, `rxMethod`).

## 11. ADR

- [ADR-001](../adr/ADR-001-zoneless.md): migración a zoneless (`provideZonelessChangeDetection()`). Aceptada en W5.

## 12. Historial de cambios de la spec

| Versión | Cambio                                                                                |
| ------- | ------------------------------------------------------------------------------------- |
| v1      | Versión inicial aprobada antes de implementar                                         |
| v1.1    | Añadidos D12 (Retry), D13 (accesibilidad) y `notification-message.ts`, surgidos en W4 |
| v1.2    | W5 ejecutado: ADR-001 aceptada; zone.js solo en tests                                 |
| v1.3    | Evidencias de validación y trazabilidad completadas (W6)                              |
