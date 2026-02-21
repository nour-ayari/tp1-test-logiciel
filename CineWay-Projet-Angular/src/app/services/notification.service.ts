import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationResponse {
  subscribed: boolean;
  message: string;
}

export interface EmailStatus {
  emails_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  from_email: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  subscribeToMovie(movieId: number): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${this.apiUrl}/movies/${movieId}/notify`, {});
  }

  unsubscribeFromMovie(movieId: number): Observable<NotificationResponse> {
    return this.http.delete<NotificationResponse>(`${this.apiUrl}/movies/${movieId}/notify`);
  }

  checkEmailStatus(): Observable<EmailStatus> {
    return this.http.get<EmailStatus>(`${this.apiUrl}/test-email/status`);
  }

  sendTestEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/test-email/send-test`, { email });
  }
}
