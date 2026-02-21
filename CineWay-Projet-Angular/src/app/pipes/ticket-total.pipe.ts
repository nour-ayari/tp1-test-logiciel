import { Pipe, PipeTransform } from '@angular/core';

interface TicketItem {
  price: number;
  count: number;
}

/**
 * Calculates total price for a ticket item
 */
@Pipe({
  name: 'ticketTotal',
  pure: true,
})
export class TicketTotalPipe implements PipeTransform {
  transform(
    ticket: TicketItem | null | undefined,
    format: 'number' | 'currency' = 'number',
  ): string | number {
    if (!ticket) return 0;

    const total = ticket.price * ticket.count;

    if (format === 'currency') {
      return `$${total.toFixed(2)}`;
    }

    return total;
  }
}
