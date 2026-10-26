import { toNotificationMessage } from './notification-message';

describe('toNotificationMessage', () => {
  it('mantiene los textos del legacy y añade el cambio de ejercicio', () => {
    expect(toNotificationMessage(null)).toBeNull();
    expect(toNotificationMessage({ type: 'rest-started' })).toBe('Rest time');
    expect(toNotificationMessage({ type: 'repetition-started' })).toBe('Back to exercise');
    expect(toNotificationMessage({ type: 'exercise-started', exerciseName: 'Lunges' })).toBe(
      'Next exercise: Lunges',
    );
    expect(toNotificationMessage({ type: 'workout-completed' })).toBe('Workout completed');
  });
});
