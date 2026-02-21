import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats showtime date strings with various format options
 * Usage: {{ '2026-02-01T14:30:00' | showtimeDate }} => "Sun, Feb 1"
 * Usage: {{ '2026-02-01T14:30:00' | showtimeDate:'time' }} => "2:30 PM"
 * Usage: {{ '2026-02-01T14:30:00' | showtimeDate:'full' }} => "Sunday, February 1, 2026"
 * Usage: {{ '2026-02-01T14:30:00' | showtimeDate:'relative' }} => "Today" | "Tomorrow" | "Sun, Feb 1"
 */
@Pipe({
  name: 'showtimeDate',
  pure: true,
})
export class ShowtimeDatePipe implements PipeTransform {
  transform(
    dateString: string | null | undefined,
    format: 'short' | 'time' | 'full' | 'relative' = 'short',
  ): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    switch (format) {
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

      case 'full':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

      case 'relative':
        return this.getRelativeDate(date);

      case 'short':
      default:
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
    }
  }

  private getRelativeDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
}
