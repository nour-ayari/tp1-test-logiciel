import { describe, it, expect } from 'vitest';
import { MovieDurationPipe } from '../app/pipes/movie-duration.pipe';

describe('MovieDurationPipe', () => {
  const pipe = new MovieDurationPipe();

  it('returns empty string for null/undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns empty string for negative minutes', () => {
    expect(pipe.transform(-1)).toBe('');
  });

  it('formats minutes (<60) in long format', () => {
    expect(pipe.transform(45)).toBe('45min');
    expect(pipe.transform(0)).toBe('0min');
  });

  it('formats minutes (>=60) in long format', () => {
    expect(pipe.transform(60)).toBe('1h');
    expect(pipe.transform(145)).toBe('2h 25min');
  });

  it('formats minutes in short format', () => {
    expect(pipe.transform(145, 'short')).toBe('2:25');
    expect(pipe.transform(60, 'short')).toBe('1:00');
    expect(pipe.transform(5, 'short')).toBe('0:05');
  });
});