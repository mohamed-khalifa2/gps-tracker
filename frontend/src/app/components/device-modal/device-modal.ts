import { Component, signal, inject, input, output, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Device, DevicePayload } from '../../models/device.model';
import { DeviceService } from '../../services/device.service';
import { APIModel } from '../../models/api.model';

const COLORS = ['#4f8ef7', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

@Component({
  selector: 'app-device-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './device-modal.html',
  styleUrl: './device-modal.css',
})
export class DeviceModalComponent {
  device = input.required<Device | null>();
  saved = output<Device>();
  closed = output<void>();

  private deviceSvc = inject(DeviceService);

  readonly colors = signal(COLORS);
  isEdit = signal(false);

  name = signal('');
  deviceId = signal('');
  description = signal('');
  color = signal(COLORS[0]);
  isActive = signal(true);
  error = signal('');
  saving = signal(false);

  constructor() {
    effect(() => {
      const d = this.device();
      if (d) {
        this.isEdit.set(true);
        this.name.set(d.name);
        this.deviceId.set(d.deviceId);
        this.description.set(d.description ?? '');
        this.color.set(d.color);
        this.isActive.set(d.isActive);
      } else {
        this.isEdit.set(false);
        this.name.set('');
        this.deviceId.set('');
        this.description.set('');
        this.color.set(COLORS[0]);
        this.isActive.set(true);
      }
    });
  }

  submit() {
    this.error.set('');
    this.saving.set(true);

    const payload: DevicePayload = {
      name: this.name(),
      deviceId: this.deviceId(),
      description: this.description(),
      color: this.color(),
      isActive: this.isActive(),
    };

    const req = this.isEdit()
      ? this.deviceSvc.update(this.device()!._id, payload)
      : this.deviceSvc.create(payload);

    req.subscribe({
      next: (res: APIModel<Device>) => {
        this.saved.emit(res.data);
        this.closed.emit();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Something went wrong');
        this.saving.set(false);
      },
    });
  }
}
