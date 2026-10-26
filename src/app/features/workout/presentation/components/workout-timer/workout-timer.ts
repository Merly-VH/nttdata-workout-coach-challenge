import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Phase } from '../../../domain/models/workout-session';
import { formatSeconds } from '../../utils/format-seconds';

/**
 * Presentacional: solo recibe datos y emite intenciones del usuario.
 * No inyecta dependencias ni conoce el store.
 */
@Component({
  selector: 'app-workout-timer',
  templateUrl: './workout-timer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkoutTimerComponent {
  readonly exerciseName = input.required<string>();
  readonly phase = input.required<Phase>();
  readonly remainingSeconds = input.required<number>();
  readonly completedRepetitions = input.required<number>();
  readonly totalRepetitions = input.required<number>();
  readonly canStart = input.required<boolean>();
  readonly canPause = input.required<boolean>();
  readonly finished = input.required<boolean>();

  readonly startRequested = output<void>();
  readonly pauseRequested = output<void>();
  readonly resetRequested = output<void>();

  protected readonly formattedTime = computed(() => formatSeconds(this.remainingSeconds()));
  protected readonly phaseLabel = computed(() => {
    if (this.finished()) {
      return 'Finished';
    }
    return this.phase() === 'rest' ? 'Rest' : 'Exercise';
  });
}
