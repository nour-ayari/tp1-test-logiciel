import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FaqService, FAQ } from '../../services/faq.service';

interface FAQWithState extends FAQ {
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  imports: [CommonModule, RouterLink],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class Faq implements OnInit {
  faqs: FAQWithState[] = [];
  isLoading = true;

  constructor(private faqService: FaqService) {}

  ngOnInit() {
    this.loadFaqs();
  }

  private loadFaqs() {
    this.faqService.getFaqs().subscribe({
      next: (faqs) => {
        this.faqs = faqs.map((faq) => ({ ...faq, isOpen: false }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading FAQs:', error);
        this.isLoading = false;
      },
    });
  }

  toggleFAQ(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
}
