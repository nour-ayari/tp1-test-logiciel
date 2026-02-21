import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FaqService, FAQ } from '../../../../services/faq.service';
import { PrimaryButtonComponent } from '../../components/primary-button/primary-button';
import {
  AdminDataTableComponent,
  TableColumn,
  TableAction,
} from '../../components/admin-data-table/admin-data-table';

@Component({
  selector: 'app-admin-faqs',
  imports: [CommonModule, PrimaryButtonComponent, AdminDataTableComponent],
  templateUrl: './admin-faqs.html',
  styleUrls: ['./admin-faqs.css'],
})
export class AdminFaqsComponent implements OnInit {
  private router = inject(Router);
  private faqService = inject(FaqService);
  private destroyRef = inject(DestroyRef);

  readonly tableColumns: TableColumn[] = [
    { key: 'question', label: 'Question', width: '40%' },
    { key: 'answer', label: 'Answer', width: '50%' },
    { key: 'id', label: 'ID', width: '10%' },
  ];

  readonly tableActions: TableAction[] = [
    { type: 'edit', label: 'Edit' },
    { type: 'delete', label: 'Delete' },
  ];

  readonly faqs = signal<FAQ[]>([]);
  readonly isLoading = signal<boolean>(false);

  ngOnInit() {
    this.loadFaqs();
  }

  private loadFaqs() {
    this.isLoading.set(true);
    this.faqService
      .getFaqs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (faqs) => {
          this.faqs.set(faqs);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading FAQs:', error);
          this.isLoading.set(false);
        },
      });
  }

  onAddNew() {
    this.router.navigate(['/admin/faqs/add']);
  }

  onAction(action: { action: string; row: FAQ }) {
    switch (action.action) {
      case 'edit':
        this.router.navigate(['/admin/faqs/edit', action.row.id]);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this FAQ?')) {
          this.deleteFaq(action.row.id);
        }
        break;
    }
  }

  private deleteFaq(faqId: number) {
    this.faqService.deleteFaq(faqId).subscribe({
      next: () => {
        this.faqs.set(this.faqs().filter((faq) => faq.id !== faqId));
      },
      error: (error) => {
        console.error('Error deleting FAQ:', error);
      },
    });
  }
}
