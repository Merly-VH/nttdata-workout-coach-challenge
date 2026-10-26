import { WorkoutSession } from './workout-session';

/** Hechos relevantes que ocurren durante un tick; la presentación decide cómo notificarlos. */
export type WorkoutEvent =
  | { readonly type: 'rest-started' }
  | { readonly type: 'repetition-started' }
  | { readonly type: 'exercise-started'; readonly exerciseName: string }
  | { readonly type: 'workout-completed' };

export interface TickResult {
  readonly session: WorkoutSession;
  readonly event: WorkoutEvent | null;
}
