import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthResponse, User } from '../models/user.model';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private socketSvc = inject(SocketService);
  private base = 'http://localhost:3000';

  // ── Signals ────────────────────────────────────────────────────
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem('token'));
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  // ── Public API ─────────────────────────────────────────────────
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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
    this.socketSvc.disconnect(); // clean up socket on logout
    this.router.navigate(['/login']);
  }

  // ── Private helpers ────────────────────────────────────────────

  /**
   * Stores token + user, then connects the socket.
   * The socket sends the JWT in handshake.auth.token.
   * The server verifies it and runs socket.join("user:<id>"),
   * so all subsequent location-update events are scoped to this user.
   */
  private persist(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._token.set(res.token);
    this._user.set(res.user);

    // ← This is the moment the user "joins" their socket room.
    //   We pass the token; the server does the join server-side.
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
