import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Exercise } from '../../domain/models/exercise';
import { WorkoutRepository } from '../../domain/ports/workout.repository';
import { ExerciseDto } from '../dto/exercise.dto';
import { toExercise } from '../mappers/exercise.mapper';

/** Respuesta simulada de la fuente externa (formato snake_case). */
export const MOCK_EXERCISES: readonly ExerciseDto[] = [
  { id: 1, exercise_name: 'Squats', repetitions_number: 3, repetition_time: 5, rest_time: 3 },
  { id: 2, exercise_name: 'Push-ups', repetitions_number: 2, repetition_time: 4, rest_time: 2 },
  { id: 3, exercise_name: 'Lunges', repetitions_number: 2, repetition_time: 4, rest_time: 2 },
];

/**
 * Adaptador del puerto WorkoutRepository.
 * Sustituirlo por un HttpWorkoutRepository solo requiere cambiar el provider en app.config.ts.
 */
@Injectable()
export class MockWorkoutRepository extends WorkoutRepository {
  getExercises(): Observable<readonly Exercise[]> {
    return of(MOCK_EXERCISES).pipe(map((dtos) => dtos.map(toExercise)));
  }
}
