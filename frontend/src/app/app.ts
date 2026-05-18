import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private auth = inject(AuthService);
  private socket = inject(SocketService);

  ngOnInit() {
    /**
     * If the user refreshed the page and a token is already stored,
     * reconnect the socket immediately so live updates work right away.
     * The server will verify the token and re-join the room.
     */
    const token = this.auth.token();
    if (token) this.socket.connect(token);
  }
}
