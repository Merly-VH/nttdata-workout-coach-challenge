import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

describe('AppComponent', () => {
  it('arranca con la configuración real y muestra los ejercicios del mock', () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: appConfig.providers,
    });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h1')?.textContent).toBe('Workout Coach');
    expect(element.querySelectorAll('app-exercise-item').length).toBe(3);
  });
});
