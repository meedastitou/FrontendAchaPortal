import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginResponse, ChangePasswordRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSignal = signal<User | null>(this.getStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isResponsable = computed(() =>
    this.currentUserSignal()?.role === 'responsable_achat' || this.currentUserSignal()?.role === 'admin'
  );

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, formData).pipe(
      tap(response => {
        this.setToken(response.access_token);
        this.setUser(response.user);
        this.currentUserSignal.set(response.user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`).pipe(
      tap(user => {
        this.setUser(user);
        this.currentUserSignal.set(user);
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/auth/change-password`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}
