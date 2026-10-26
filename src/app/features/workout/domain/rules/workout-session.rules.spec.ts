import { InvalidWorkoutError } from '../errors/invalid-workout.error';
import { Exercise } from '../models/exercise';
import { TickResult } from '../models/workout-event';
import { WorkoutSession } from '../models/workout-session';
import { createSession, pause, reset, start, tick } from './workout-session.rules';

// A: 2 repeticiones de 2 s con 1 s de descanso → 2 × (2 + 1) = 6 ticks.
// B: 1 repetición de 1 s con 1 s de descanso  → 1 × (1 + 1) = 2 ticks. Total: 8 ticks.
const EXERCISE_A: Exercise = {
  id: 1,
  name: 'A',
  repetitions: 2,
  repetitionSeconds: 2,
  restSeconds: 1,
};
const EXERCISE_B: Exercise = {
  id: 2,
  name: 'B',
  repetitions: 1,
  repetitionSeconds: 1,
  restSeconds: 1,
};
const EXERCISES: readonly Exercise[] = [EXERCISE_A, EXERCISE_B];

/** Aplica `tick` n veces y devuelve el último resultado. */
function runTicks(session: WorkoutSession, times: number): TickResult {
  let result: TickResult = { session, event: null };
  for (let i = 0; i < times; i++) {
    result = tick(result.session);
  }
  return result;
}

const startedSession = (): WorkoutSession => start(createSession(EXERCISES));

describe('workout-session rules', () => {
  describe('createSession', () => {
    it('CA-1: deja todos los ejercicios pendientes y la sesión sin iniciar', () => {
      const session = createSession(EXERCISES);

      expect(session.status).toBe('idle');
      expect(session.exercises.map((p) => p.status)).toEqual(['pending', 'pending']);
      expect(session.exercises.every((p) => p.completedRepetitions === 0)).toBeTrue();
      expect(session.currentIndex).toBe(0);
      expect(session.phase).toBe('exercise');
      expect(session.remainingSeconds).toBe(EXERCISE_A.repetitionSeconds);
    });

    it('CA-8: rechaza una lista vacía', () => {
      expect(() => createSession([])).toThrowError(InvalidWorkoutError);
    });

    it('CA-10: rechaza datos inválidos', () => {
      const invalid: Exercise[] = [
        { ...EXERCISE_A, name: '   ' },
        { ...EXERCISE_A, repetitions: 0 },
        { ...EXERCISE_A, repetitionSeconds: -1 },
        { ...EXERCISE_A, restSeconds: 1.5 },
      ];
      for (const exercise of invalid) {
        expect(() => createSession([exercise])).toThrowError(InvalidWorkoutError);
      }
    });

    it('normaliza el nombre del ejercicio', () => {
      const session = createSession([{ ...EXERCISE_A, name: '  Squats  ' }]);
      expect(session.exercises[0].exercise.name).toBe('Squats');
    });
  });

  describe('start', () => {
    it('CA-2: activa el primer ejercicio con su tiempo de repetición', () => {
      const session = startedSession();

      expect(session.status).toBe('running');
      expect(session.exercises[0].status).toBe('in-progress');
      expect(session.exercises[1].status).toBe('pending');
      expect(session.remainingSeconds).toBe(EXERCISE_A.repetitionSeconds);
    });

    it('CA-11: no hace nada si ya está en curso o finalizada', () => {
      const running = startedSession();
      const finished = runTicks(running, 8).session;

      expect(start(running)).toBe(running);
      expect(start(finished)).toBe(finished);
    });
  });

  describe('tick', () => {
    it('CA-12: no hace nada si la sesión no está en curso', () => {
      const idle = createSession(EXERCISES);
      const result = tick(idle);

      expect(result.session).toBe(idle);
      expect(result.event).toBeNull();
    });

    it('descuenta un segundo sin emitir evento mientras no llega a cero', () => {
      const result = tick(startedSession());

      expect(result.session.remainingSeconds).toBe(1);
      expect(result.event).toBeNull();
    });

    it('CA-3: al llegar a cero inicia el descanso con rest_time', () => {
      const { session, event } = runTicks(startedSession(), 2);

      expect(session.phase).toBe('rest');
      expect(session.remainingSeconds).toBe(EXERCISE_A.restSeconds);
      expect(event).toEqual({ type: 'rest-started' });
    });

    it('CA-4: al terminar el descanso incrementa la repetición completada', () => {
      const { session, event } = runTicks(startedSession(), 3);

      expect(session.exercises[0].completedRepetitions).toBe(1);
      expect(session.phase).toBe('exercise');
      expect(session.remainingSeconds).toBe(EXERCISE_A.repetitionSeconds);
      expect(event).toEqual({ type: 'repetition-started' });
    });

    it('CA-5: al completar las repeticiones completa el ejercicio y arranca el siguiente', () => {
      const { session, event } = runTicks(startedSession(), 6);

      expect(session.exercises[0].status).toBe('completed');
      expect(session.exercises[0].completedRepetitions).toBe(2);
      expect(session.exercises[1].status).toBe('in-progress');
      expect(session.currentIndex).toBe(1);
      expect(session.phase).toBe('exercise');
      expect(session.remainingSeconds).toBe(EXERCISE_B.repetitionSeconds);
      expect(event).toEqual({ type: 'exercise-started', exerciseName: 'B' });
    });

    it('CA-6: al completar el último ejercicio finaliza el entrenamiento', () => {
      const { session, event } = runTicks(startedSession(), 8);

      expect(session.status).toBe('finished');
      expect(session.remainingSeconds).toBe(0);
      expect(session.exercises.map((p) => p.status)).toEqual(['completed', 'completed']);
      expect(event).toEqual({ type: 'workout-completed' });
      expect(tick(session).session).toBe(session);
    });

    it('no muta la sesión recibida', () => {
      const session = startedSession();
      const snapshot = structuredClone(session);

      runTicks(session, 8);

      expect(session).toEqual(snapshot);
    });
  });

  describe('pause y reset', () => {
    it('CA-7: pausar conserva el progreso y start lo reanuda', () => {
      const afterOneTick = tick(startedSession()).session;
      const paused = pause(afterOneTick);

      expect(paused.status).toBe('paused');
      expect(paused.remainingSeconds).toBe(afterOneTick.remainingSeconds);
      expect(tick(paused).session).toBe(paused);

      const resumed = start(paused);
      expect(resumed.status).toBe('running');
      expect(resumed.remainingSeconds).toBe(afterOneTick.remainingSeconds);
      expect(resumed.exercises).toEqual(afterOneTick.exercises);
    });

    it('CA-11: pausar una sesión que no está en curso no hace nada', () => {
      const idle = createSession(EXERCISES);
      expect(pause(idle)).toBe(idle);
    });

    it('CA-7: reiniciar vuelve al estado inicial', () => {
      const advanced = runTicks(startedSession(), 5).session;

      expect(reset(advanced)).toEqual(createSession(EXERCISES));
    });
  });
});
