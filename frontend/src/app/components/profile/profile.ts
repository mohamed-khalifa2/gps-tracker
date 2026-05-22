import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent {
  private auth = inject(AuthService);
  readonly user = this.auth.user;

  name = signal(this.user()?.name ?? '');
  email = signal(this.user()?.email ?? '');
  currentPassword = signal('');
  newPassword = signal('');

  profileMessage = signal('');
  passwordMessage = signal('');
  profileError = signal('');
  passwordError = signal('');

  loadingProfile = signal(false);
  loadingPassword = signal(false);

  saveProfile() {
    this.profileMessage.set('');
    this.profileError.set('');
    this.loadingProfile.set(true);

    this.auth.updateProfile({ name: this.name(), email: this.email() }).subscribe({
      next: () => {
        this.profileMessage.set('Profile updated successfully.');
        this.loadingProfile.set(false);
      },
      error: (err) => {
        this.profileError.set(err.error?.message ?? 'Unable to save profile.');
        this.loadingProfile.set(false);
      },
    });
  }

  changePassword() {
    this.passwordMessage.set('');
    this.passwordError.set('');
    this.loadingPassword.set(true);

    this.auth
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: () => {
          this.passwordMessage.set('Password updated successfully.');
          this.currentPassword.set('');
          this.newPassword.set('');
          this.loadingPassword.set(false);
        },
        error: (err) => {
          this.passwordError.set(err.error?.message ?? 'Unable to update password.');
          this.loadingPassword.set(false);
        },
      });
  }
}
