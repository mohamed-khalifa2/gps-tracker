import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthResponse, User } from '../models/user.model';
import { SocketService } from './socket.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private socketSvc = inject(SocketService);
  private base = environment.BASE;

  // ── Signals
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem('token'));
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  // ── Public API
  register(payload: { name: string; email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/register`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  login(payload: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/login`, payload)
      .pipe(tap((res) => this.persist(res)));
  }

  updateProfile(payload: { name: string; email: string }) {
    return this.http
      .put<{ success: boolean; data: User }>(`${this.base}/api/users/me`, payload)
      .pipe(
        tap((res) => {
          const current = this._user();
          const nextUser = current ? { ...current, ...res.data } : res.data;
          localStorage.setItem('user', JSON.stringify(nextUser));
          this._user.set(nextUser);
        }),
      );
  }

  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.base}/api/users/me/password`,
      payload,
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._user.set(null);
    this.socketSvc.disconnect(); // clean up socket on logout
    this.router.navigate(['/login']);
  }

  // ── Private helpers
  private persist(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._token.set(res.token);
    this._user.set(res.user);
    this.socketSvc.connect(res.token);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
