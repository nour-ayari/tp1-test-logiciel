import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_API } from '../config/app-api.config';

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  constructor(private http: HttpClient) {}

  getFaqs(): Observable<FAQ[]> {
    return this.http.get<FAQ[]>(APP_API.faqs.list);
  }

  createFaq(faq: { question: string; answer: string }): Observable<FAQ> {
    return this.http.post<FAQ>(APP_API.faqs.create, faq);
  }

  deleteFaq(faqId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(APP_API.faqs.delete(faqId));
  }
}
