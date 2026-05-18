import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocationPoint } from '../models/location.model';

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
export class LocationService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000';
  getHistory(deviceId: string, limit = 100) {
    return this.http.get<ApiList<LocationPoint>>(
      `${this.base}/api/location/${deviceId}/history?limit=${limit}`,
    );
  }

  getLatest(deviceId: string) {
    return this.http.get<ApiSingle<LocationPoint>>(`${this.base}/api/location/${deviceId}/latest`);
  }
}
