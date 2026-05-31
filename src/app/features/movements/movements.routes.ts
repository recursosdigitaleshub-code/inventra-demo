import { Routes } from '@angular/router';

export const movementsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/movements.page').then(m => m.MovementsPage),
  },
];
