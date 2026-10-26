import { InvalidWorkoutError } from '../../domain/errors/invalid-workout.error';
import { ExerciseDto } from '../dto/exercise.dto';
import { toExercise } from './exercise.mapper';

const DTO: ExerciseDto = {
  id: 7,
  exercise_name: 'Squats',
  repetitions_number: 3,
  repetition_time: 5,
  rest_time: 3,
};

describe('toExercise', () => {
  it('CA-A3: traduce el DTO snake_case al modelo de dominio', () => {
    expect(toExercise(DTO)).toEqual({
      id: 7,
      name: 'Squats',
      repetitions: 3,
      repetitionSeconds: 5,
      restSeconds: 3,
    });
  });

  it('CA-10: rechaza un DTO que viola las invariantes del dominio', () => {
    expect(() => toExercise({ ...DTO, repetitions_number: 0 })).toThrowError(InvalidWorkoutError);
    expect(() => toExercise({ ...DTO, exercise_name: '' })).toThrowError(InvalidWorkoutError);
  });
});
