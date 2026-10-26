# ADR-001 — Migración a detección de cambios zoneless

| Campo           | Valor                                                            |
| --------------- | ---------------------------------------------------------------- |
| Estado          | Aceptada                                                         |
| Fecha           | 2026-10-26                                                       |
| Relacionada con | Spec `docs/spec/workout-refactor.md`, decisión D1, workstream W5 |

## Contexto

La base recibida (Angular 20.3) no incluía zone.js y fallaba en runtime con `NG0908`.
Se evaluaron dos opciones en la línea base:

- **zoneless inmediato:** la app cargaba, pero el temporizador no se refrescaba en pantalla,
  porque el componente legacy mutaba campos de clase dentro de `setInterval` y, sin zone.js,
  Angular no se entera de esas mutaciones.
- **zone.js:** preservaba el comportamiento legacy.

Se eligió zone.js como paso temporal (D1) y migrar cuando todo el estado fuera reactivo.

## Decisión

Tras W2–W4, todo el estado de la vista vive en signals (`WorkoutSessionStore`) y los
componentes usan `OnPush`. Se activa `provideZonelessChangeDetection()` en `app.config.ts`
y se elimina zone.js de los polyfills del build.

zone.js se mantiene **solo en tests** (`devDependencies`, polyfills de `test`) porque
`fakeAsync` lo requiere para controlar el reloj en `interval-ticker.spec.ts`.

## Consecuencias

**Positivas**

- Se elimina `polyfills.js` del bundle inicial (34,6 kB sin comprimir / ~11 kB transferidos).
- La detección de cambios es explícita: se renderiza cuando cambia un signal, no tras cualquier
  evento asíncrono del navegador.
- Las trazas de error son más limpias (sin frames de zone.js).
- Alinea el proyecto con el modo por defecto de versiones posteriores de Angular.

**Negativas / riesgos**

- Cualquier estado nuevo que no use signals (o `markForCheck`) no se reflejará en la vista.
  Mitigación: regla de proyecto en `CLAUDE.md` y componentes `OnPush`.
- Los tests y la app usan modos distintos de detección de cambios. Mitigación:
  `app.component.spec.ts` arranca con `appConfig` real (zoneless).

## Verificación

- `npm run build`: sin `polyfills.js`.
- `npm run test:ci`: 53 tests en verde.
- Prueba manual del entrenamiento completo en navegador.
