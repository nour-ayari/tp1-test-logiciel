import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FaqService, FAQ } from '../../../../services/faq.service';

@Component({
  selector: 'app-add-edit-faq-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-faq-page.html',
  styleUrls: ['./add-edit-faq-page.css'],
})
export class AddEditFaqPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private faqService = inject(FaqService);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  faqId = signal<number | null>(null);

  form!: FormGroup;

  ngOnInit() {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm() {
    this.form = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(10)]],
      answer: ['', [Validators.required, Validators.minLength(20)]],
    });
  }

  private checkEditMode() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.faqId.set(parseInt(id, 10));
      this.loadFaq(parseInt(id, 10));
    }
  }

  private loadFaq(id: number) {
    this.loading.set(true);
    this.faqService
      .getFaqs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (faqs) => {
          const faq = faqs.find((f) => f.id === id);
          if (faq) {
            this.form.patchValue({
              question: faq.question,
              answer: faq.answer,
            });
          } else {
            this.error.set('FAQ not found');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading FAQ:', err);
          this.error.set('Failed to load FAQ');
          this.loading.set(false);
        },
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.form.value;

    if (this.isEditMode()) {
      // For edit mode, we need to update the FAQ
      // Since the API doesn't have an update endpoint, we'll delete and create
      this.faqService.deleteFaq(this.faqId()!).subscribe({
        next: () => {
          this.faqService.createFaq(formValue).subscribe({
            next: () => {
              this.router.navigate(['/admin/faqs']);
            },
            error: (err) => {
              console.error('Error updating FAQ:', err);
              this.error.set('Failed to update FAQ');
              this.loading.set(false);
            },
          });
        },
        error: (err) => {
          console.error('Error deleting FAQ for update:', err);
          this.error.set('Failed to update FAQ');
          this.loading.set(false);
        },
      });
    } else {
      this.faqService.createFaq(formValue).subscribe({
        next: () => {
          this.router.navigate(['/admin/faqs']);
        },
        error: (err) => {
          console.error('Error creating FAQ:', err);
          this.error.set('Failed to create FAQ');
          this.loading.set(false);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/faqs']);
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }
}
