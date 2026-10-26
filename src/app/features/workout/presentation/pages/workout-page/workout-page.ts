import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { WorkoutSessionStore } from '../../../application/state/workout-session.store';
import { ExerciseListComponent } from '../../components/exercise-list/exercise-list';
import { WorkoutTimerComponent } from '../../components/workout-timer/workout-timer';
import { WorkoutToastComponent } from '../../components/workout-toast/workout-toast';
import { toNotificationMessage } from '../../utils/notification-message';

/**
 * Container: único componente de la feature que inyecta dependencias.
 * Lee el estado del store y lo reparte a los presentacionales; traduce sus outputs a comandos.
 */
@Component({
  selector: 'app-workout-page',
  imports: [WorkoutTimerComponent, ExerciseListComponent, WorkoutToastComponent],
  templateUrl: './workout-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WorkoutSessionStore],
})
export class WorkoutPageComponent implements OnInit {
  protected readonly store = inject(WorkoutSessionStore);
  protected readonly toastMessage = computed(() =>
    toNotificationMessage(this.store.notification()),
  );

  ngOnInit(): void {
    this.store.load();
  }
}
