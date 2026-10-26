import { InvalidWorkoutError } from '../errors/invalid-workout.error';
import { Exercise } from '../models/exercise';
import { TickResult } from '../models/workout-event';
import { ExerciseProgress, WorkoutSession } from '../models/workout-session';

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value >= 1;

/** Valida las invariantes de un ejercicio y devuelve una copia normalizada. */
export function createExercise(data: Exercise): Exercise {
  const name = data.name.trim();
  if (name === '') {
    throw new InvalidWorkoutError('Exercise name is required');
  }
  const numericFields = {
    repetitions: data.repetitions,
    repetitionSeconds: data.repetitionSeconds,
    restSeconds: data.restSeconds,
  };
  for (const [field, value] of Object.entries(numericFields)) {
    if (!isPositiveInteger(value)) {
      throw new InvalidWorkoutError(`Exercise "${name}": ${field} must be a positive integer`);
    }
  }
  return { ...data, name };
}

/** CA-1: crea la sesión en estado inicial (todo pendiente, sin iniciar). */
export function createSession(exercises: readonly Exercise[]): WorkoutSession {
  if (exercises.length === 0) {
    throw new InvalidWorkoutError('Workout must contain at least one exercise');
  }
  const validExercises = exercises.map(createExercise);
  return {
    exercises: validExercises.map((exercise) => ({
      exercise,
      status: 'pending',
      completedRepetitions: 0,
    })),
    currentIndex: 0,
    phase: 'exercise',
    remainingSeconds: validExercises[0].repetitionSeconds,
    status: 'idle',
  };
}

/** CA-2 / CA-7: idle → running (activa el primero); paused → running (reanuda). */
export function start(session: WorkoutSession): WorkoutSession {
  switch (session.status) {
    case 'idle':
      return {
        ...replaceProgress(session, 0, { ...session.exercises[0], status: 'in-progress' }),
        status: 'running',
      };
    case 'paused':
      return { ...session, status: 'running' };
    default:
      return session;
  }
}

/** CA-7: running → paused conservando fase y segundos. */
export function pause(session: WorkoutSession): WorkoutSession {
  return session.status === 'running' ? { ...session, status: 'paused' } : session;
}

/** CA-7: vuelve al estado inicial con los mismos ejercicios. */
export function reset(session: WorkoutSession): WorkoutSession {
  return createSession(session.exercises.map((progress) => progress.exercise));
}

/** Avanza un segundo. Reglas de transición: spec §5.1. */
export function tick(session: WorkoutSession): TickResult {
  if (session.status !== 'running') {
    return { session, event: null };
  }

  const remainingSeconds = session.remainingSeconds - 1;
  if (remainingSeconds > 0) {
    return { session: { ...session, remainingSeconds }, event: null };
  }

  const index = session.currentIndex;
  const current = session.exercises[index];

  // CA-3: fin de la repetición → descanso.
  if (session.phase === 'exercise') {
    return {
      session: { ...session, phase: 'rest', remainingSeconds: current.exercise.restSeconds },
      event: { type: 'rest-started' },
    };
  }

  // CA-4: fin del descanso → repetición completada.
  const completedRepetitions = current.completedRepetitions + 1;
  if (completedRepetitions < current.exercise.repetitions) {
    return {
      session: {
        ...replaceProgress(session, index, { ...current, completedRepetitions }),
        phase: 'exercise',
        remainingSeconds: current.exercise.repetitionSeconds,
      },
      event: { type: 'repetition-started' },
    };
  }

  const withCurrentCompleted = replaceProgress(session, index, {
    ...current,
    completedRepetitions,
    status: 'completed',
  });
  const nextIndex = index + 1;

  // CA-6: era el último ejercicio → fin del entrenamiento.
  if (nextIndex >= session.exercises.length) {
    return {
      session: { ...withCurrentCompleted, status: 'finished', remainingSeconds: 0 },
      event: { type: 'workout-completed' },
    };
  }

  // CA-5: arranca el siguiente ejercicio.
  const next = session.exercises[nextIndex];
  return {
    session: {
      ...replaceProgress(withCurrentCompleted, nextIndex, { ...next, status: 'in-progress' }),
      currentIndex: nextIndex,
      phase: 'exercise',
      remainingSeconds: next.exercise.repetitionSeconds,
    },
    event: { type: 'exercise-started', exerciseName: next.exercise.name },
  };
}

/** Devuelve una nueva sesión con el progreso del índice indicado reemplazado (inmutable). */
function replaceProgress(
  session: WorkoutSession,
  index: number,
  progress: ExerciseProgress,
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((item, i) => (i === index ? progress : item)),
  };
}
