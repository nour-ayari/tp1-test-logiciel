import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms movie duration from minutes to a readable format
 * Usage: {{ 145 | movieDuration }} => "2h 25min"
 * Usage: {{ 145 | movieDuration:'short' }} => "2:25"
 */
@Pipe({
  name: 'movieDuration',

  pure: true,
})
export class MovieDurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined, format: 'long' | 'short' = 'long'): string {
    if (minutes == null || minutes < 0) return '';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (format === 'short') {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }

    if (hours === 0) {
      return `${mins}min`;
    }

    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}
