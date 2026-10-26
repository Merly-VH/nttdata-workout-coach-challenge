import { Exercise } from './exercise';

export type ExerciseStatus = 'pending' | 'in-progress' | 'completed';

export interface ExerciseProgress {
  readonly exercise: Exercise;
  readonly status: ExerciseStatus;
  readonly completedRepetitions: number;
}

export type Phase = 'exercise' | 'rest';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'finished';

/** Estado completo e inmutable de una sesión de entrenamiento. */
export interface WorkoutSession {
  readonly exercises: readonly ExerciseProgress[];
  /** Índice del ejercicio activo (0 mientras la sesión está en idle). */
  readonly currentIndex: number;
  readonly phase: Phase;
  readonly remainingSeconds: number;
  readonly status: SessionStatus;
}
