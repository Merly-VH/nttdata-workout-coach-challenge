import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExerciseProgress } from '../../../domain/models/workout-session';
import { ExerciseItemComponent } from '../exercise-item/exercise-item';

@Component({
  selector: 'app-exercise-list',
  imports: [ExerciseItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="exercise-list" aria-label="Exercises">
      @for (progress of exercises(); track progress.exercise.id) {
        <li [attr.aria-current]="progress.status === 'in-progress' ? 'step' : null">
          <app-exercise-item [item]="progress" />
        </li>
      }
    </ul>
  `,
})
export class ExerciseListComponent {
  readonly exercises = input.required<readonly ExerciseProgress[]>();
}
