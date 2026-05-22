export interface Device {
  _id: string;
  name: string;
  deviceId: string;
  owner: string;
  description?: string;
  isActive: boolean;
  isMoving: boolean;
  lastSpeed: number;
  color: string;
  createdAt: string;
}

export interface DevicePayload {
  name: string;
  deviceId: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}
