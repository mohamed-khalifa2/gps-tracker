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
  modal = signal<'add' | Device | null>(null);
  deleting = signal<string | null>(null);

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
        console.log(this.devices());
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
      console.log(55);
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
  logout() {
    this.auth.logout();
  }
}
