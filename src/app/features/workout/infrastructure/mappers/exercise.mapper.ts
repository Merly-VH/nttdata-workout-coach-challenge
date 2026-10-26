import { Exercise } from '../../domain/models/exercise';
import { createExercise } from '../../domain/rules/workout-session.rules';
import { ExerciseDto } from '../dto/exercise.dto';

/**
 * Traduce el DTO externo al modelo de dominio (anti-corruption layer).
 * Valida con la regla del dominio: un DTO inválido lanza InvalidWorkoutError.
 */
export function toExercise(dto: ExerciseDto): Exercise {
  return createExercise({
    id: dto.id,
    name: dto.exercise_name,
    repetitions: dto.repetitions_number,
    repetitionSeconds: dto.repetition_time,
    restSeconds: dto.rest_time,
  });
}
