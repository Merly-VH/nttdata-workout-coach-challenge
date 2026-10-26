import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WorkoutSession } from '../../domain/models/workout-session';
import { WorkoutRepository } from '../../domain/ports/workout.repository';
import { createSession } from '../../domain/rules/workout-session.rules';

/** Caso de uso: obtener los ejercicios y construir la sesión inicial. */
@Injectable({ providedIn: 'root' })
export class LoadWorkoutUseCase {
  private readonly repository = inject(WorkoutRepository);

  /** Emite la sesión en estado idle o un error (repositorio o InvalidWorkoutError). */
  execute(): Observable<WorkoutSession> {
    return this.repository.getExercises().pipe(map((exercises) => createSession(exercises)));
  }
}
