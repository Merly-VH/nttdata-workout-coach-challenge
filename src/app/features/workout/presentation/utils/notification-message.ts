import { WorkoutEvent } from '../../domain/models/workout-event';

/** Traduce un evento de dominio al texto visible (decisión D6: UI en inglés). */
export function toNotificationMessage(event: WorkoutEvent | null): string | null {
  if (!event) {
    return null;
  }
  switch (event.type) {
    case 'rest-started':
      return 'Rest time';
    case 'repetition-started':
      return 'Back to exercise';
    case 'exercise-started':
      return `Next exercise: ${event.exerciseName}`;
    case 'workout-completed':
      return 'Workout completed';
  }
}
