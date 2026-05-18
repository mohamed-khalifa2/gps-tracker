import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Device, DevicePayload } from '../../models/device.model';
import { DeviceService } from '../../services/device.service';

const COLORS = ['#4f8ef7', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

@Component({
  selector: 'app-device-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './device-modal.html',
  styleUrl: './device-modal.css',
})
export class DeviceModalComponent {
  @Input() device: Device | null = null; // null = add mode
  @Output() saved = new EventEmitter<Device>();
  @Output() closed = new EventEmitter<void>();

  private deviceSvc = inject(DeviceService);

  readonly colors = COLORS;
  isEdit = false;

  name = signal('');
  deviceId = signal('');
  description = signal('');
  color = signal(COLORS[0]);
  isActive = signal(true);
  error = signal('');
  saving = signal(false);

  ngOnInit() {
    this.isEdit = !!this.device;
    if (this.device) {
      this.name.set(this.device.name);
      this.deviceId.set(this.device.deviceId);
      this.description.set(this.device.description ?? '');
      this.color.set(this.device.color);
      this.isActive.set(this.device.isActive);
    }
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

    const req = this.isEdit
      ? this.deviceSvc.update(this.device!._id, payload)
      : this.deviceSvc.create(payload);

    req.subscribe({
      next: (res) => {
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
