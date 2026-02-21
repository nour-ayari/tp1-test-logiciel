import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.css'],
})
export class PaginationComponent {
  startIndex = input(0);
  endIndex = input(0);
  totalCount = input(0);
  page = input(1);
  totalPages = input(1);

  previous = output<void>();
  next = output<void>();
}
