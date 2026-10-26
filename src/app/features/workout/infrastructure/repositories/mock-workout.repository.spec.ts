import { firstValueFrom } from 'rxjs';
import { MOCK_EXERCISES, MockWorkoutRepository } from './mock-workout.repository';

describe('MockWorkoutRepository', () => {
  it('devuelve la lista de ejercicios ya mapeada al dominio', async () => {
    const exercises = await firstValueFrom(new MockWorkoutRepository().getExercises());

    expect(exercises.length).toBe(MOCK_EXERCISES.length);
    expect(exercises[0]).toEqual({
      id: 1,
      name: 'Squats',
      repetitions: 3,
      repetitionSeconds: 5,
      restSeconds: 3,
    });
  });
});
