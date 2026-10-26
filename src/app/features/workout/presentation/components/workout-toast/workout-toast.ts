import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Notificación accesible: la región aria-live siempre existe y anuncia cada cambio. */
@Component({
  selector: 'app-workout-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status" aria-live="polite">
      @if (message(); as text) {
        <div class="toast">{{ text }}</div>
      }
    </div>
  `,
})
export class WorkoutToastComponent {
  readonly message = input<string | null>(null);
}
