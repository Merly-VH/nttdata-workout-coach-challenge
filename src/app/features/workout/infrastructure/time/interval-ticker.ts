import { Injectable } from '@angular/core';
import { Observable, interval, map } from 'rxjs';
import { Ticker } from '../../application/ports/ticker';

const ONE_SECOND_MS = 1000;

/**
 * Adaptador real del puerto Ticker basado en rxjs `interval`.
 * Es un Observable "frío": el timer solo existe mientras hay suscripción,
 * y al cancelar la suscripción se limpia el setInterval interno.
 */
@Injectable()
export class IntervalTicker extends Ticker {
  ticks(): Observable<void> {
    return interval(ONE_SECOND_MS).pipe(map((): void => undefined));
  }
}
