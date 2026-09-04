import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { ApiResponse } from '../models/tenant.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/v1/auth';
  private currentUserSignal = signal<AuthResponse | null>(null);

  currentUser = computed(() => this.currentUserSignal());
  isAuthenticated = computed(() => !!this.currentUserSignal()?.token);

  constructor(private http: HttpClient, private router: Router) {
    const saved = localStorage.getItem('saas_master_user');
    if (saved) {
      try {
        this.currentUserSignal.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('saas_master_user');
      }
    }
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          localStorage.setItem('saas_master_token', res.data.token);
          localStorage.setItem('saas_master_user', JSON.stringify(res.data));
          this.currentUserSignal.set(res.data);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('saas_master_token');
  }

  logout(): void {
    localStorage.removeItem('saas_master_token');
    localStorage.removeItem('saas_master_user');
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
