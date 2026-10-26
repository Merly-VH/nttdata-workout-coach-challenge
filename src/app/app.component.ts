import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkoutPageComponent } from './features/workout/presentation/pages/workout-page/workout-page';

@Component({
  selector: 'app-root',
  imports: [WorkoutPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-workout-page />`,
})
export class AppComponent {}
