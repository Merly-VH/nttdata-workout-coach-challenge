/** Se lanza cuando los datos del entrenamiento violan una invariante del dominio. */
export class InvalidWorkoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWorkoutError';
  }
}
