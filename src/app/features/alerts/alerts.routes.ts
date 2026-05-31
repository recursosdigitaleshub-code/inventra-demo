import { Routes } from '@angular/router';

export const alertsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/alerts.page').then(m => m.AlertsPage),
  },
];
