import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  ContactService,
  ContactFormData,
  ContactStatus,
  ContactResponse,
} from '../../services/contact.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  formAvailable = true; // Default to true, will check on init
  supportEmail: string | null = 'support@cineway.com';

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      phone: ['', [Validators.maxLength(20)]],
    });
  }

  ngOnInit(): void {
    this.checkFormAvailability();
  }

  checkFormAvailability(): void {
    this.contactService.checkStatus().subscribe({
      next: (status: ContactStatus) => {
        this.formAvailable = status.available;
        this.supportEmail = status.support_email;
      },
      error: (error: any) => {
        this.formAvailable = true;
      },
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched(this.contactForm);
      return;
    }

    this.isSubmitting = true;

    const formData: ContactFormData = this.contactForm.value;

    this.contactService.submitContactForm(formData).subscribe({
      next: (response: ContactResponse) => {
        alert(response.message);
        this.contactForm.reset();
        this.isSubmitting = false;
      },
      error: (error: any) => {
        const message = error.error?.detail || 'Failed to send your message. Please try again.';
        alert(message);
        this.isSubmitting = false;
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if a field has an error and has been touched
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.hasError(errorType) && field.touched);
  }

  /**
   * Get character count for textarea
   */
  getCharCount(fieldName: string): number {
    return this.contactForm.get(fieldName)?.value?.length || 0;
  }
}
