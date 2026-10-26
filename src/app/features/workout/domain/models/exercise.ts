/** Ejercicio del entrenamiento (modelo de dominio, independiente del DTO externo). */
export interface Exercise {
  readonly id: number;
  readonly name: string;
  /** Número de repeticiones (entero >= 1). */
  readonly repetitions: number;
  /** Duración de cada repetición en segundos (entero >= 1). */
  readonly repetitionSeconds: number;
  /** Duración del descanso tras cada repetición en segundos (entero >= 1). */
  readonly restSeconds: number;
}
