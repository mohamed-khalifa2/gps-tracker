import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Device, DevicePayload } from '../models/device.model';
import { environment } from '../../environments/environment';
import { APIModel } from '../models/api.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private base = environment.BASE;
  private http = inject(HttpClient);

  getAll(): Observable<APIModel<Device[]>> {
    return this.http.get<APIModel<Device[]>>(`${this.base}/api/devices`, { withCredentials: true });
  }
  getOne(id: string): Observable<APIModel<Device>> {
    return this.http.get<APIModel<Device>>(`${this.base}/api/devices/${id}`);
  }
  create(payload: DevicePayload): Observable<APIModel<Device>> {
    return this.http.post<APIModel<Device>>(`${this.base}/api/devices`, payload);
  }
  update(id: string, p: Partial<DevicePayload>): Observable<APIModel<Device>> {
    return this.http.put<APIModel<Device>>(`${this.base}/api/devices/${id}`, p);
  }
  delete(id: string) {
    return this.http.delete<{ success: boolean }>(`${this.base}/api/devices/${id}`);
  }
}
