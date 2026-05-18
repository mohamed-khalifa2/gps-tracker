import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Device, DevicePayload } from '../models/device.model';

interface ApiList<T> {
  success: boolean;
  count: number;
  data: T[];
}
interface ApiSingle<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private base = 'http://localhost:3000';
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<ApiList<Device>>(`${this.base}/api/devices`, { withCredentials: true });
  }
  getOne(id: string) {
    return this.http.get<ApiSingle<Device>>(`${this.base}/api/devices/${id}`);
  }
  create(payload: DevicePayload) {
    return this.http.post<ApiSingle<Device>>(`${this.base}/api/devices`, payload);
  }
  update(id: string, p: Partial<DevicePayload>) {
    return this.http.put<ApiSingle<Device>>(`${this.base}/api/devices/${id}`, p);
  }
  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.base}/api/devices/${id}`);
  }
}
