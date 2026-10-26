import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ExerciseProgress, ExerciseStatus } from '../../../domain/models/workout-session';

const STATUS_LABELS: Record<ExerciseStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In progress',
  completed: 'Completed',
};

@Component({
  selector: 'app-exercise-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'exercise-item' },
  template: `
    <span class="exercise-name">{{ item().exercise.name }}</span>
    <span class="exercise-reps">
      {{ item().completedRepetitions }} / {{ item().exercise.repetitions }} reps
    </span>
    <span [class]="statusClass()">{{ statusLabel() }}</span>
  `,
})
export class ExerciseItemComponent {
  readonly item = input.required<ExerciseProgress>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.item().status]);
  protected readonly statusClass = computed(() => `status status--${this.item().status}`);
}
