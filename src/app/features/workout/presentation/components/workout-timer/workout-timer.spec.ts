import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutTimerComponent } from './workout-timer';

describe('WorkoutTimerComponent', () => {
  let fixture: ComponentFixture<WorkoutTimerComponent>;
  let element: HTMLElement;

  const DEFAULT_INPUTS = {
    exerciseName: 'Squats',
    phase: 'exercise',
    remainingSeconds: 5,
    completedRepetitions: 1,
    totalRepetitions: 3,
    canStart: true,
    canPause: false,
    finished: false,
  };

  function render(overrides: Partial<typeof DEFAULT_INPUTS> = {}): void {
    for (const [name, value] of Object.entries({ ...DEFAULT_INPUTS, ...overrides })) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === label,
    );
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkoutTimerComponent);
    element = fixture.nativeElement;
  });

  it('muestra ejercicio, fase, tiempo mm:ss y repeticiones', () => {
    render();

    expect(element.querySelector('h2')?.textContent).toBe('Squats');
    expect(element.querySelector('.phase')?.textContent).toBe('Exercise');
    expect(element.querySelector('.timer')?.textContent).toBe('00:05');
    expect(element.textContent).toContain('Completed repetitions: 1 / 3');
  });

  it('marca visualmente la fase de descanso', () => {
    render({ phase: 'rest' });

    const phase = element.querySelector('.phase');
    expect(phase?.textContent).toBe('Rest');
    expect(phase?.classList).toContain('rest');
  });

  it('emite startRequested al pulsar Start', () => {
    render();
    const spy = jasmine.createSpy('start');
    fixture.componentInstance.startRequested.subscribe(spy);

    button('Start')?.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('muestra Pause en curso y emite pauseRequested', () => {
    render({ canStart: false, canPause: true });
    const spy = jasmine.createSpy('pause');
    fixture.componentInstance.pauseRequested.subscribe(spy);

    expect(button('Start')).toBeUndefined();
    button('Pause')?.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emite resetRequested al pulsar Reset', () => {
    render();
    const spy = jasmine.createSpy('reset');
    fixture.componentInstance.resetRequested.subscribe(spy);

    button('Reset')?.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('D8: al finalizar muestra Finished y deshabilita Start', () => {
    render({ finished: true, canStart: false, remainingSeconds: 0, phase: 'rest' });

    expect(element.querySelector('.phase')?.textContent).toBe('Finished');
    expect(element.querySelector('.timer')?.textContent).toBe('00:00');
    expect(button('Start')?.disabled).toBeTrue();
  });
});
