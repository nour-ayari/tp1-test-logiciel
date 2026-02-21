import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  imports: [CommonModule],
  templateUrl: './search-input.html',
  styleUrls: ['./search-input.css'],
})
export class SearchInputComponent {
  label = input('');
  placeholder = input('');
  value = input('');
  showLabel = input(true);
  valueChange = output<string>();

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
