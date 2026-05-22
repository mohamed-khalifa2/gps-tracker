import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DeviceService } from '../../services/device.service';
import { SocketService } from '../../services/socket.service';
import { Device } from '../../models/device.model';
import { LocationPoint } from '../../models/location.model';
import { DeviceModalComponent } from '../device-modal/device-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DeviceModalComponent, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  private auth = inject(AuthService);
  private deviceSvc = inject(DeviceService);
  private socketSvc = inject(SocketService);
  private router = inject(Router);

  readonly user = this.auth.user;
  readonly connected = this.socketSvc.connected;

  devices = signal<Device[]>([]);
  loading = signal(true);
  modal = signal<'add' | Device | null>(null);
  deleting = signal<string | null>(null);

  dropdownOpen = signal(false);
  settingsOpen = signal(false);
  name = signal('');
  email = signal('');
  currentPassword = signal('');
  newPassword = signal('');
  profileMessage = signal('');
  passwordMessage = signal('');
  profileError = signal('');
  passwordError = signal('');
  loadingProfile = signal(false);
  loadingPassword = signal(false);

  private sub!: Subscription;

  ngOnInit() {
    this.loadDevices();

    // Live: patch device card when a new ping arrives for any of our devices
    this.sub = this.socketSvc.on<LocationPoint>('location-update').subscribe((data) => {
      this.devices.update((list) =>
        list.map((device) =>
          device.deviceId === data.deviceId
            ? {
                ...device,
                isMoving: data.isMoving,
                lastSpeed: data.speed,
                lastSeen: data.createdAt,
              }
            : device,
        ),
      );
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadDevices() {
    this.deviceSvc.getAll().subscribe({
      next: (res) => {
        this.devices.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSaved(saved: Device) {
    this.devices.update((list) => {
      const idx = list.findIndex((d) => d._id === saved._id);
      if (idx === -1) return [saved, ...list];
      const next = [...list];
      next[idx] = saved;
      return next;
    });
  }

  deleteDevice(device: Device) {
    if (!confirm(`Delete "${device.name}" and all its history?`)) return;
    this.deviceSvc.delete(device._id).subscribe({
      next: () => {
        this.devices.update((list) =>
          list.filter((existingDevices) => existingDevices._id !== device._id),
        );
      },
      error: (err) => alert(err.error?.message ?? 'Delete failed'),
    });
  }

  track(dev: Device) {
    this.router.navigate(['/tracker', dev.deviceId]);
  }

  openSettings() {
    this.dropdownOpen.set(false);
    const user = this.user();
    this.name.set(user?.name ?? '');
    this.email.set(user?.email ?? '');
    this.currentPassword.set('');
    this.newPassword.set('');
    this.profileMessage.set('');
    this.passwordMessage.set('');
    this.profileError.set('');
    this.passwordError.set('');
    this.loadingProfile.set(false);
    this.loadingPassword.set(false);
    this.settingsOpen.set(true);
  }

  closeSettings() {
    this.settingsOpen.set(false);
  }

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
      .changePassword({ currentPassword: this.currentPassword(), newPassword: this.newPassword() })
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

  logout() {
    this.auth.logout();
  }
}
