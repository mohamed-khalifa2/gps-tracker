import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
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
  imports: [DeviceModalComponent],
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
  modal = signal<'add' | Device | null>(null); // null=closed, 'add'=new, Device=edit
  deleting = signal<string | null>(null);

  private sub!: Subscription;

  ngOnInit() {
    this.loadDevices();

    // Live: patch device card when a new ping arrives for any of our devices
    this.sub = this.socketSvc.on<LocationPoint>('location-update').subscribe((data) => {
      this.devices.update((list) =>
        list.map((d) =>
          d.deviceId === data.deviceId
            ? { ...d, isMoving: data.isMoving, lastSpeed: data.speed, lastSeen: data.createdAt }
            : d,
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

  deleteDevice(dev: Device) {
    if (!confirm(`Delete "${dev.name}" and all its history?`)) return;
    this.deleting.set(dev._id);
    this.deviceSvc.delete(dev._id).subscribe({
      next: () => {
        this.devices.update((l) => l.filter((d) => d._id !== dev._id));
      },
      error: (err) => alert(err.error?.message ?? 'Delete failed'),
      complete: () => this.deleting.set(null),
    });
  }

  track(dev: Device) {
    this.router.navigate(['/tracker', dev.deviceId]);
  }
  logout() {
    this.auth.logout();
  }
  timeAgo = timeAgo;
}

function timeAgo(date: string | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString();
}
