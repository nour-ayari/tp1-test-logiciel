import { describe, it, expect } from 'vitest';
import { TimeToHoursPipe } from '../app/pipes/time-tohours-pipe';

describe('TimeToHoursPipe', () => {
  const pipe = new TimeToHoursPipe();

  it('returns empty string for null/undefined/negative', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(-5)).toBe('');
  });

  it('formats minutes correctly', () => {
    expect(pipe.transform(0)).toBe('0h:00min');
    expect(pipe.transform(5)).toBe('0h:05min');
    expect(pipe.transform(60)).toBe('1h:00min');
    expect(pipe.transform(125)).toBe('2h:05min');
  });
});