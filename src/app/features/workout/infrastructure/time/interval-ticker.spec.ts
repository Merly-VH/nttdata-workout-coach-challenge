import { fakeAsync, tick } from '@angular/core/testing';
import { IntervalTicker } from './interval-ticker';

/**
 * `flush: false` hace la comprobación estricta: si al terminar el test queda un
 * setInterval vivo, fakeAsync falla con "1 periodic timer(s) still in the queue".
 * Por defecto (flush: true) Angular los descartaría en silencio.
 */
const STRICT = { flush: false };

describe('IntervalTicker', () => {
  it('emite una vez por segundo mientras hay suscripción', fakeAsync(() => {
    let count = 0;
    const subscription = new IntervalTicker().ticks().subscribe(() => count++);

    tick(999);
    expect(count).toBe(0);

    tick(1);
    expect(count).toBe(1);

    tick(2000);
    expect(count).toBe(3);

    subscription.unsubscribe();
  }, STRICT));

  it('CA-13: deja de emitir y no deja timers vivos al cancelar la suscripción', fakeAsync(() => {
    let count = 0;
    const subscription = new IntervalTicker().ticks().subscribe(() => count++);
    tick(1000);

    subscription.unsubscribe();
    tick(5000);

    expect(count).toBe(1);
  }, STRICT));

  it('no crea ningún timer hasta que alguien se suscribe', fakeAsync(() => {
    const ticks$ = new IntervalTicker().ticks();
    tick(5000);

    let count = 0;
    const subscription = ticks$.subscribe(() => count++);
    tick(1000);

    expect(count).toBe(1); // cuenta desde la suscripción, no desde la creación
    subscription.unsubscribe();
  }, STRICT));
});
