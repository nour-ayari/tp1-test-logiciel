import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';

import { APP_API } from '../../config/app-api.config';
import { LoginResponseDto } from '../dto/login-response.dto';
import { LoginRequestDto } from '../dto/login-request.dto';
import { SignupRequestDto } from '../dto/signup-request.dto';
import { User } from '../model/user';
import { UserApi } from '../../services/user-api';

export type ChangePasswordRequestDto = {
  current_password: string;
  new_password: string;
};

export type ChangePasswordResponseDto = {
  message: string;
};
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private _loading = signal(false);
  public loading = this._loading.asReadonly();
  userApi = inject(UserApi);
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  constructor() {}

  login(credentials: LoginRequestDto): Observable<LoginResponseDto> {
    this._loading.set(true);
    const body = new HttpParams()
      .set('username', credentials.username.trim())
      .set('password', credentials.password);
    return this.http
      .post<LoginResponseDto>(APP_API.auth.login, body.toString(), {
        headers: { 'content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.access_token);
          this.userApi.reload();
        }),

        finalize(() => this._loading.set(false)),
      );
  }

  signup(data: SignupRequestDto): Observable<User> {
    this._loading.set(true);
    return this.http
      .post<User>(APP_API.auth.signup, data)
      .pipe(finalize(() => this._loading.set(false)));
  }

  checkEmailExists(email: string): Observable<boolean> {
    if (!email) {
      return of(false);
    }
    return this.http
      .get<{ exists: boolean }>(`${APP_API.auth.checkmail}?email=${encodeURIComponent(email)}`)
      .pipe(map((response) => response.exists));
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  changePassword(data: {
    current_password: string;
    new_password: string;
  }): Observable<{ message: string }> {
    this._loading.set(true);
    return this.http
      .put<{ message: string }>(APP_API.auth.changePassword, data)
      .pipe(finalize(() => this._loading.set(false)));
  }
}
