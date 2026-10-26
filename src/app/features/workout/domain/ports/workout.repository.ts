import type { Observable } from 'rxjs';
import { Exercise } from '../models/exercise';

/**
 * Puerto de salida: el dominio define QUÉ necesita; infrastructure decide CÓMO obtenerlo.
 * Es una clase abstracta para poder usarla como token de inyección en Angular
 * sin que el dominio importe nada de Angular (decisión D4 de la spec).
 */
export abstract class WorkoutRepository {
  abstract getExercises(): Observable<readonly Exercise[]>;
}
