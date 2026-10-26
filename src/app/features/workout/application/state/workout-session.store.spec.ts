import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Exercise } from '../../domain/models/exercise';
import { WorkoutRepository } from '../../domain/ports/workout.repository';
import { Ticker } from '../ports/ticker';
import { WorkoutSessionStore } from './workout-session.store';

// Mismos datos que los tests de dominio: A = 6 ticks, B = 2 ticks, total 8.
const EXERCISES: readonly Exercise[] = [
  { id: 1, name: 'A', repetitions: 2, repetitionSeconds: 2, restSeconds: 1 },
  { id: 2, name: 'B', repetitions: 1, repetitionSeconds: 1, restSeconds: 1 },
];

/** Doble del reloj: el test decide cuándo "pasa un segundo". */
class FakeTicker extends Ticker {
  private readonly subject = new Subject<void>();
  ticks(): Observable<void> {
    return this.subject.asObservable();
  }
  emit(times = 1): void {
    for (let i = 0; i < times; i++) {
      this.subject.next();
    }
  }
  /** true si alguien está suscrito, es decir, si hay un timer activo. */
  get isTicking(): boolean {
    return this.subject.observed;
  }
}

class FakeWorkoutRepository extends WorkoutRepository {
  constructor(private readonly result: Observable<readonly Exercise[]>) {
    super();
  }
  getExercises(): Observable<readonly Exercise[]> {
    return this.result;
  }
}

function setup(result: Observable<readonly Exercise[]> = of(EXERCISES)) {
  const ticker = new FakeTicker();
  TestBed.configureTestingModule({
    providers: [
      WorkoutSessionStore,
      { provide: Ticker, useValue: ticker },
      { provide: WorkoutRepository, useValue: new FakeWorkoutRepository(result) },
    ],
  });
  const store = TestBed.inject(WorkoutSessionStore);
  return { store, ticker };
}

function setupLoaded() {
  const context = setup();
  context.store.load();
  return context;
}

describe('WorkoutSessionStore', () => {
  describe('load', () => {
    it('empieza en loading antes de cargar', () => {
      const { store } = setup();
      expect(store.viewState()).toBe('loading');
    });

    it('CA-1: carga la sesión pendiente y no inicia sola', () => {
      const { store, ticker } = setupLoaded();

      expect(store.viewState()).toBe('ready');
      expect(store.session()?.status).toBe('idle');
      expect(store.canStart()).toBeTrue();
      expect(store.canPause()).toBeFalse();
      expect(ticker.isTicking).toBeFalse();
    });

    it('CA-8: muestra error si la lista está vacía', () => {
      const { store } = setup(of([]));
      store.load();

      expect(store.viewState()).toBe('error');
      expect(store.errorMessage()).toBe('Workout must contain at least one exercise');
    });

    it('CA-9: muestra un error genérico si falla el repositorio', () => {
      const { store } = setup(throwError(() => new Error('network down')));
      store.load();

      expect(store.viewState()).toBe('error');
      expect(store.errorMessage()).toBe('Could not load workout');
    });
  });

  describe('sesión', () => {
    it('CA-2: start activa el primer ejercicio y arranca el reloj', () => {
      const { store, ticker } = setupLoaded();
      store.start();

      expect(store.session()?.status).toBe('running');
      expect(store.currentExercise()?.status).toBe('in-progress');
      expect(ticker.isTicking).toBeTrue();
    });

    it('CA-3: notifica el inicio del descanso', () => {
      const { store, ticker } = setupLoaded();
      store.start();
      ticker.emit(2);

      expect(store.session()?.phase).toBe('rest');
      expect(store.notification()).toEqual({ type: 'rest-started' });
    });

    it('CA-11: un segundo start no crea un segundo timer', () => {
      const { store, ticker } = setupLoaded();
      store.start();
      store.start();
      ticker.emit(1);

      expect(store.session()?.remainingSeconds).toBe(1);
    });

    it('CA-6 / CA-13: al finalizar notifica y detiene el reloj', () => {
      const { store, ticker } = setupLoaded();
      store.start();
      ticker.emit(8);

      expect(store.session()?.status).toBe('finished');
      expect(store.notification()).toEqual({ type: 'workout-completed' });
      expect(store.canStart()).toBeFalse();
      expect(ticker.isTicking).toBeFalse();
    });

    it('CA-7: pause detiene el reloj conservando el progreso y start lo reanuda', () => {
      const { store, ticker } = setupLoaded();
      store.start();
      ticker.emit(1);
      store.pause();

      expect(store.session()?.status).toBe('paused');
      expect(ticker.isTicking).toBeFalse();
      expect(store.session()?.remainingSeconds).toBe(1);

      store.start();
      expect(ticker.isTicking).toBeTrue();
      ticker.emit(1);
      expect(store.session()?.phase).toBe('rest');
    });

    it('CA-7: reset vuelve al estado inicial y limpia la notificación', () => {
      const { store, ticker } = setupLoaded();
      store.start();
      ticker.emit(3);
      store.reset();

      expect(store.session()?.status).toBe('idle');
      expect(store.session()?.exercises.every((p) => p.status === 'pending')).toBeTrue();
      expect(store.notification()).toBeNull();
      expect(ticker.isTicking).toBeFalse();
    });

    it('CA-13: al destruirse el contexto se cancela el reloj', () => {
      const { store, ticker } = setupLoaded();
      store.start();

      TestBed.resetTestingModule();

      expect(ticker.isTicking).toBeFalse();
    });

    it('ignora los comandos si todavía no hay sesión', () => {
      const { store, ticker } = setup();
      store.start();
      store.pause();
      store.reset();

      expect(store.session()).toBeNull();
      expect(ticker.isTicking).toBeFalse();
    });
  });
});
