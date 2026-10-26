import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { InvalidWorkoutError } from '../../domain/errors/invalid-workout.error';
import { Exercise } from '../../domain/models/exercise';
import { WorkoutRepository } from '../../domain/ports/workout.repository';
import { LoadWorkoutUseCase } from './load-workout.use-case';

const EXERCISES: readonly Exercise[] = [
  { id: 1, name: 'A', repetitions: 2, repetitionSeconds: 2, restSeconds: 1 },
];

/** Doble del puerto: devuelve lo que el test le indique. */
class FakeWorkoutRepository extends WorkoutRepository {
  constructor(private readonly result: Observable<readonly Exercise[]>) {
    super();
  }
  getExercises(): Observable<readonly Exercise[]> {
    return this.result;
  }
}

function setup(result: Observable<readonly Exercise[]>): LoadWorkoutUseCase {
  TestBed.configureTestingModule({
    providers: [{ provide: WorkoutRepository, useValue: new FakeWorkoutRepository(result) }],
  });
  return TestBed.inject(LoadWorkoutUseCase);
}

describe('LoadWorkoutUseCase', () => {
  it('CA-1: construye la sesión inicial a partir del repositorio', async () => {
    const session = await firstValueFrom(setup(of(EXERCISES)).execute());

    expect(session.status).toBe('idle');
    expect(session.exercises.length).toBe(1);
    expect(session.exercises[0].status).toBe('pending');
  });

  it('CA-8: emite InvalidWorkoutError si el repositorio devuelve una lista vacía', async () => {
    await expectAsync(firstValueFrom(setup(of([])).execute())).toBeRejectedWithError(
      InvalidWorkoutError,
    );
  });

  it('CA-9: propaga el error del repositorio', async () => {
    const failure = new Error('network down');

    await expectAsync(firstValueFrom(setup(throwError(() => failure)).execute())).toBeRejectedWith(
      failure,
    );
  });
});
