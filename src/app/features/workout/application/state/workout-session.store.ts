import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { InvalidWorkoutError } from '../../domain/errors/invalid-workout.error';
import { WorkoutEvent } from '../../domain/models/workout-event';
import { ExerciseProgress, WorkoutSession } from '../../domain/models/workout-session';
import * as rules from '../../domain/rules/workout-session.rules';
import { Ticker } from '../ports/ticker';
import { LoadWorkoutUseCase } from '../use-cases/load-workout.use-case';

export type ViewState = 'loading' | 'ready' | 'error';

/**
 * Estado de la sesión expuesto con signals.
 * Orquesta casos de uso y reglas de dominio; no contiene reglas propias.
 * Se provee en el container, así que su ciclo de vida es el de la página.
 */
@Injectable()
export class WorkoutSessionStore {
  private readonly loadWorkout = inject(LoadWorkoutUseCase);
  private readonly ticker = inject(Ticker);
  private readonly destroyRef = inject(DestroyRef);

  private readonly viewStateSignal = signal<ViewState>('loading');
  private readonly sessionSignal = signal<WorkoutSession | null>(null);
  private readonly notificationSignal = signal<WorkoutEvent | null>(null);
  private readonly errorMessageSignal = signal<string | null>(null);

  private tickSubscription: Subscription | null = null;

  readonly viewState = this.viewStateSignal.asReadonly();
  readonly session = this.sessionSignal.asReadonly();
  readonly notification = this.notificationSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();

  readonly currentExercise = computed<ExerciseProgress | null>(() => {
    const session = this.sessionSignal();
    return session ? session.exercises[session.currentIndex] : null;
  });
  readonly canStart = computed(() => {
    const status = this.sessionSignal()?.status;
    return status === 'idle' || status === 'paused';
  });
  readonly canPause = computed(() => this.sessionSignal()?.status === 'running');

  constructor() {
    // CA-13: ningún timer sobrevive a la destrucción del container.
    this.destroyRef.onDestroy(() => this.stopTicking());
  }

  load(): void {
    this.stopTicking();
    this.viewStateSignal.set('loading');
    this.loadWorkout
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.sessionSignal.set(session);
          this.notificationSignal.set(null);
          this.errorMessageSignal.set(null);
          this.viewStateSignal.set('ready');
        },
        error: (error: unknown) => {
          // CA-8 / CA-9 / CA-10
          this.errorMessageSignal.set(
            error instanceof InvalidWorkoutError ? error.message : 'Could not load workout',
          );
          this.viewStateSignal.set('error');
        },
      });
  }

  start(): void {
    const session = this.sessionSignal();
    if (!session) {
      return;
    }
    const started = rules.start(session);
    if (started === session) {
      return; // CA-11: ya en curso o finalizada.
    }
    this.sessionSignal.set(started);
    this.tickSubscription ??= this.ticker.ticks().subscribe(() => this.onTick());
  }

  pause(): void {
    const session = this.sessionSignal();
    if (!session) {
      return;
    }
    this.stopTicking();
    this.sessionSignal.set(rules.pause(session));
  }

  reset(): void {
    const session = this.sessionSignal();
    if (!session) {
      return;
    }
    this.stopTicking();
    this.sessionSignal.set(rules.reset(session));
    this.notificationSignal.set(null);
  }

  private onTick(): void {
    const session = this.sessionSignal();
    if (!session) {
      return;
    }
    const { session: next, event } = rules.tick(session);
    this.sessionSignal.set(next);
    if (event) {
      this.notificationSignal.set(event);
    }
    if (next.status === 'finished') {
      this.stopTicking();
    }
  }

  private stopTicking(): void {
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = null;
  }
}
