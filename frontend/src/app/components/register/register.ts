import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = signal('');
  email = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    this.loading.set(true);

    this.auth
      .register({ name: this.name(), email: this.email(), password: this.password() })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.error.set(err.error?.message ?? 'Registration failed');
          this.loading.set(false);
        },
      });
  }
}
