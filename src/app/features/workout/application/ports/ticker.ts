import { Observable } from 'rxjs';

/**
 * Puerto del paso del tiempo (decisión D9 de la spec).
 * La aplicación solo sabe que "pasa un segundo"; infrastructure decide cómo (setInterval, rxjs…)
 * y los tests lo sustituyen por un doble que emite a demanda.
 */
export abstract class Ticker {
  /** Emite una vez por segundo mientras haya una suscripción activa. */
  abstract ticks(): Observable<void>;
}
