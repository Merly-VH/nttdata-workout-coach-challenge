/**
 * Contrato externo tal como lo entrega la fuente de datos (snake_case).
 * Solo se usa dentro de infrastructure; nunca llega al dominio ni a la vista.
 */
export interface ExerciseDto {
  id: number;
  exercise_name: string;
  repetitions_number: number;
  repetition_time: number;
  rest_time: number;
}
