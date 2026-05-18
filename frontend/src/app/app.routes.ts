import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './guards/auth.guard-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./components/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./components/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'tracker/:deviceId',
    canActivate: [authGuard],
    loadComponent: () => import('./components/tracker/tracker').then((m) => m.TrackerComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
