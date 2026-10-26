import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseProgress } from '../../../domain/models/workout-session';
import { ExerciseItemComponent } from './exercise-item';

const PROGRESS: ExerciseProgress = {
  exercise: { id: 1, name: 'Squats', repetitions: 3, repetitionSeconds: 5, restSeconds: 3 },
  status: 'pending',
  completedRepetitions: 0,
};

describe('ExerciseItemComponent', () => {
  let fixture: ComponentFixture<ExerciseItemComponent>;
  let element: HTMLElement;

  function render(item: ExerciseProgress): void {
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(ExerciseItemComponent);
    element = fixture.nativeElement;
  });

  it('muestra nombre y progreso de repeticiones', () => {
    render({ ...PROGRESS, completedRepetitions: 2 });

    expect(element.querySelector('.exercise-name')?.textContent).toBe('Squats');
    expect(element.querySelector('.exercise-reps')?.textContent?.trim()).toBe('2 / 3 reps');
  });

  it('muestra cada estado con su etiqueta y clase', () => {
    const cases = [
      { status: 'pending', label: 'Pending' },
      { status: 'in-progress', label: 'In progress' },
      { status: 'completed', label: 'Completed' },
    ] as const;

    for (const { status, label } of cases) {
      render({ ...PROGRESS, status });
      const badge = element.querySelector('.status');

      expect(badge?.textContent).toBe(label);
      expect(badge?.classList).toContain(`status--${status}`);
    }
  });
});
