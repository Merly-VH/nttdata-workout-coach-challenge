import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Ticker } from '../../../application/ports/ticker';
import { Exercise } from '../../../domain/models/exercise';
import { WorkoutRepository } from '../../../domain/ports/workout.repository';
import { WorkoutPageComponent } from './workout-page';

const EXERCISES: readonly Exercise[] = [
  { id: 1, name: 'Squats', repetitions: 1, repetitionSeconds: 2, restSeconds: 1 },
  { id: 2, name: 'Lunges', repetitions: 1, repetitionSeconds: 1, restSeconds: 1 },
];

class FakeTicker extends Ticker {
  private readonly subject = new Subject<void>();
  ticks(): Observable<void> {
    return this.subject.asObservable();
  }
  emit(times = 1): void {
    for (let i = 0; i < times; i++) {
      this.subject.next();
    }
  }
}

class FakeWorkoutRepository extends WorkoutRepository {
  constructor(private readonly result: Observable<readonly Exercise[]>) {
    super();
  }
  getExercises(): Observable<readonly Exercise[]> {
    return this.result;
  }
}

/** Test de integración del container con dobles de los puertos (sin timers reales). */
describe('WorkoutPageComponent', () => {
  let fixture: ComponentFixture<WorkoutPageComponent>;
  let element: HTMLElement;
  let ticker: FakeTicker;

  function setup(result: Observable<readonly Exercise[]> = of(EXERCISES)): void {
    ticker = new FakeTicker();
    TestBed.configureTestingModule({
      imports: [WorkoutPageComponent],
      providers: [
        { provide: Ticker, useValue: ticker },
        { provide: WorkoutRepository, useValue: new FakeWorkoutRepository(result) },
      ],
    });
    fixture = TestBed.createComponent(WorkoutPageComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  const text = (selector: string): string =>
    element.querySelector(selector)?.textContent?.trim() ?? '';
  const statuses = (): string[] =>
    Array.from(element.querySelectorAll('.status')).map((s) => s.textContent?.trim() ?? '');
  const click = (label: string): void => {
    Array.from(element.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === label)
      ?.click();
    fixture.detectChanges();
  };
  const advance = (seconds: number): void => {
    ticker.emit(seconds);
    fixture.detectChanges();
  };

  it('CA-1: muestra la lista completa pendiente sin iniciar', () => {
    setup();

    expect(text('h2')).toBe('Squats');
    expect(text('.timer')).toBe('00:02');
    expect(statuses()).toEqual(['Pending', 'Pending']);
  });

  it('CA-2 a CA-6: recorre el entrenamiento completo en pantalla', () => {
    setup();

    click('Start');
    expect(statuses()).toEqual(['In progress', 'Pending']);

    advance(2);
    expect(text('.phase')).toBe('Rest');
    expect(text('.toast')).toBe('Rest time');

    advance(1);
    expect(text('h2')).toBe('Lunges');
    expect(text('.toast')).toBe('Next exercise: Lunges');
    expect(statuses()).toEqual(['Completed', 'In progress']);

    advance(2);
    expect(text('.phase')).toBe('Finished');
    expect(text('.toast')).toBe('Workout completed');
    expect(statuses()).toEqual(['Completed', 'Completed']);
  });

  it('CA-7: Pause conserva el tiempo y Reset vuelve al inicio', () => {
    setup();
    click('Start');
    advance(1);
    click('Pause');
    advance(3);

    expect(text('.timer')).toBe('00:01');

    click('Reset');
    expect(text('.timer')).toBe('00:02');
    expect(statuses()).toEqual(['Pending', 'Pending']);
    expect(element.querySelector('.toast')).toBeNull();
  });

  it('CA-9: muestra el error de carga y permite reintentar', () => {
    setup(throwError(() => new Error('network down')));

    expect(text('[role="alert"]')).toBe('Could not load workout');
    expect(element.querySelector('button')?.textContent?.trim()).toBe('Retry');
  });
});
