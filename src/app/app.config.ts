import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { Ticker } from './features/workout/application/ports/ticker';
import { WorkoutRepository } from './features/workout/domain/ports/workout.repository';
import { MockWorkoutRepository } from './features/workout/infrastructure/repositories/mock-workout.repository';
import { IntervalTicker } from './features/workout/infrastructure/time/interval-ticker';

/**
 * Composition root: el único lugar donde se decide qué adaptador implementa cada puerto.
 * Cambiar el mock por HTTP real solo requeriría tocar esta línea.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // ADR-001: detección de cambios sin zone.js; los signals notifican a Angular qué renderizar.
    provideZonelessChangeDetection(),
    { provide: WorkoutRepository, useClass: MockWorkoutRepository },
    { provide: Ticker, useClass: IntervalTicker },
  ],
};
