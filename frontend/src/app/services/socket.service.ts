import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  readonly connected = signal(false);
  private SOCKET_URL = environment.BASE;

  connect(token: string): void {
    this.disconnect();

    this.socket = io(this.SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('connect_error', (err) =>
      console.warn('[Socket] connection error:', err.message),
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      if (!this.socket) return;
      const handler = (data: T) => observer.next(data);
      this.socket.on(event, handler);
      return () => this.socket?.off(event, handler);
    });
  }
}
