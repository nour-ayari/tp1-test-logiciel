import { CommonModule } from '@angular/common';
import { Component, input, output, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface MultiSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-multi-select-dropdown',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './multi-select-dropdown.html',
  styleUrls: ['./multi-select-dropdown.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectDropdownComponent),
      multi: true,
    },
  ],
})
export class MultiSelectDropdownComponent implements ControlValueAccessor {
  label = input('');
  placeholder = input('Select items...');
  options = input<MultiSelectOption[]>([]);
  control = input<any>(null);
  required = input(false);
  showLabel = input(true);
  valueChange = output<string[]>();

  selectedValues = signal<string[]>([]);
  disabled = signal(false);
  isOpen = signal(false);

  onChange: (value: string[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | string[]): void {
    this.selectedValues.set(Array.isArray(value) ? value : value ? [value] : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggleDropdown(): void {
    if (!this.disabled()) {
      this.isOpen.update(val => !val);
    }
  }

  toggleOption(value: string): void {
    const currentValues = this.selectedValues();
    const index = currentValues.indexOf(value);
    let newValues: string[];
    
    if (index > -1) {
      newValues = currentValues.filter((_, i) => i !== index);
    } else {
      newValues = [...currentValues, value];
    }
    
    this.selectedValues.set(newValues);
    this.onChange(newValues);
    this.valueChange.emit(newValues);
  }

  removeTag(value: string, event: Event): void {
    event.stopPropagation();
    this.toggleOption(value);
  }

  isSelected(value: string): boolean {
    return this.selectedValues().includes(value);
  }

  getSelectedLabels(): string {
    return this.selectedValues()
      .map(val => this.options().find(opt => opt.value === val)?.label || val)
      .join(', ');
  }

  getSelectedLabel(value: string): string {
    return this.options().find(opt => opt.value === value)?.label || value;
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.onTouched();
  }
}
