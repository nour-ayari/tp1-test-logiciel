import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export type FilterOption = { value: string; label: string };

@Component({
  selector: 'app-filter-dropdown',
  imports: [CommonModule],
  templateUrl: './filter-dropdown.html',
  styleUrls: ['./filter-dropdown.css'],
})
export class FilterDropdownComponent {
  label = input('');
  value = input('');
  options = input<FilterOption[]>([]);
  showLabel = input(true);
  valueChange = output<string>();

  onChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.valueChange.emit(target.value);
  }
}
