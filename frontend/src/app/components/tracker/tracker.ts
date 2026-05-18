import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  signal,
  inject,
  NgZone,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { SocketService } from '../../services/socket.service';
import { LocationService } from '../../services/location.service';
import { LocationPoint } from '../../models/location.model';

const STALE_MS = 12_000;
const SIDEBAR_W = 290;

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [],
  templateUrl: './tracker.html',
  styleUrl: './tracker.css',
})
export class TrackerComponent implements OnInit, AfterViewInit, OnDestroy {
  // #mapEl is now the direct Leaflet target — a plain <div id="map">
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zone = inject(NgZone);
  private socket = inject(SocketService);
  private locSvc = inject(LocationService);

  readonly connected = this.socket.connected;

  deviceId = '';
  loading = signal(true);
  latest = signal<LocationPoint | null>(null);
  track = signal<LocationPoint[]>([]);
  autoFollow = signal(true);
  isMoving = signal(false);
  speed = signal(0);

  private map!: L.Map;
  private mapReady = false;
  private marker?: L.Marker;
  private polyline?: L.Polyline;
  private sub!: Subscription;
  private ro?: ResizeObserver;
  private staleTimer?: ReturnType<typeof setTimeout>;

  private readonly pinIcon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:20px;height:20px;
                  display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:20px;height:20px;
                    background:rgba(79,142,247,0.25);border-radius:50%;
                    animation:trackerPulse 2s ease-out infinite;"></div>
        <div style="position:relative;width:12px;height:12px;
                    background:#4f8ef7;border:2px solid #fff;border-radius:50%;
                    box-shadow:0 0 8px rgba(79,142,247,0.8);z-index:1;"></div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get('deviceId')!;

    this.locSvc.getHistory(this.deviceId, 100).subscribe({
      next: (res) => {
        const ordered = [...res.data].reverse();
        this.track.set(ordered);
        if (ordered.length) {
          const last = ordered.at(-1)!;
          this.latest.set(last);
          this.isMoving.set(last.isMoving);
          this.speed.set(last.speed);
        }
        this.loading.set(false);
        if (this.mapReady) this.refreshMap();
      },
      error: () => this.loading.set(false),
    });

    this.sub = this.socket.on<LocationPoint>('location-update').subscribe((data) => {
      if (data.deviceId !== this.deviceId) return;
      this.latest.set(data);
      this.isMoving.set(data.isMoving);
      this.speed.set(data.speed);
      this.track.update((t) => [...t.slice(-199), data]);
      if (this.mapReady) this.refreshMap();

      clearTimeout(this.staleTimer);
      this.staleTimer = setTimeout(() => {
        this.zone.run(() => {
          this.isMoving.set(false);
          this.speed.set(0);
        });
      }, STALE_MS);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  ngAfterViewInit() {
    // Run outside Angular zone — Leaflet sets up many DOM listeners; keeping
    // them outside prevents unnecessary change-detection cycles.
    this.zone.runOutsideAngular(() => this.initMap());
  }

  // ─────────────────────────────────────────────────────────────────────────
  private initMap() {
    const el = this.mapEl.nativeElement;
    const mapW = window.innerWidth - SIDEBAR_W;
    const mapH = window.innerHeight;
    el.style.width = `${mapW}px`;
    el.style.height = `${mapH}px`;

  
    const last = this.latest();
    const center: L.LatLngTuple = last ? [last.lat, last.lon] : [30.7865, 31.0004];

    this.map = L.map(el, {
      center,
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
      trackResize: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20,
    }).addTo(this.map);


    const gridCell = el.parentElement!; // .tracker-layout (grid)
    this.ro = new ResizeObserver(() => {
      const w = window.innerWidth - SIDEBAR_W;
      const h = window.innerHeight;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      this.map.invalidateSize({ animate: false });
    });
    this.ro.observe(gridCell);

    this.mapReady = true;
    this.refreshMap(); // paint any data that arrived before map was ready
  }

  // ─────────────────────────────────────────────────────────────────────────
  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.ro?.disconnect();
    clearTimeout(this.staleTimer);
    this.map?.remove();
  }

  // ─────────────────────────────────────────────────────────────────────────
  goBack() {
    this.router.navigate(['/dashboard']);
  }
  fmt(n: number, d = 6) {
    return Number(n).toFixed(d);
  }
  timeStr(d: string) {
    return new Date(d).toLocaleTimeString();
  }
  recentPings() {
    return [...this.track()].reverse().slice(0, 15);
  }

  // ─────────────────────────────────────────────────────────────────────────
  private refreshMap() {
    if (!this.map) return;

    const pts = this.track().map((p) => [p.lat, p.lon] as L.LatLngTuple);
    if (pts.length > 1) {
      if (this.polyline) this.polyline.setLatLngs(pts);
      else
        this.polyline = L.polyline(pts, { color: '#4f8ef7', weight: 3, opacity: 0.8 }).addTo(
          this.map,
        );
    }

    const last = this.latest();
    if (!last) return;

    const pos: L.LatLngTuple = [last.lat, last.lon];

    if (this.marker) {
      this.marker.setLatLng(pos);
    } else {
      this.marker = L.marker(pos, { icon: this.pinIcon }).addTo(this.map);
    }

    this.marker.bindPopup(
      `<div class="lf-popup">
        <strong>${this.deviceId}</strong>
        <span>${this.isMoving() ? '▶ ' + this.speed() + ' km/h' : '■ Parked'}</span>
        <span>${this.fmt(last.lat, 5)}, ${this.fmt(last.lon, 5)}</span>
      </div>`,
    );

    if (this.autoFollow()) {
      this.map.flyTo(pos, this.map.getZoom(), { duration: 0.6 });
    }
  }
}
