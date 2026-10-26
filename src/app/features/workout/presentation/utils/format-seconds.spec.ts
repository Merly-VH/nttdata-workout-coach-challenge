import { formatSeconds } from './format-seconds';

describe('formatSeconds', () => {
  it('formatea segundos como mm:ss', () => {
    expect(formatSeconds(5)).toBe('00:05');
    expect(formatSeconds(0)).toBe('00:00');
    expect(formatSeconds(65)).toBe('01:05');
    expect(formatSeconds(600)).toBe('10:00');
  });

  it('nunca muestra valores negativos', () => {
    expect(formatSeconds(-3)).toBe('00:00');
  });
});
