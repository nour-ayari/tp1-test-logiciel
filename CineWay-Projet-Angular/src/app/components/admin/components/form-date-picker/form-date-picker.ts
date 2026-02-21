import { CommonModule } from '@angular/common';
import { Component, input, output, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-date-picker',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-date-picker.html',
  styleUrls: ['./form-date-picker.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormDatePickerComponent),
      multi: true,
    },
  ],
})
export class FormDatePickerComponent implements ControlValueAccessor {
  label = input('');
  placeholder = input('mm/dd/yyyy');
  control = input<any>(null);
  required = input(false);
  showLabel = input(true);
  valueChange = output<string>();

  value = signal('');
  disabled = signal(false);

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.valueChange.emit(target.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
