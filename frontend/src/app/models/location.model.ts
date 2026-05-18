export interface LocationPoint {
  _id?: string;
  deviceId: string;
  lat: number;
  lon: number;
  speed: number;
  altitude?: number;
  distanceMoved: number;
  isMoving: boolean;
  createdAt: string;
  deviceName?: string; // enriched by socket emit
}
