import { Routes } from '@angular/router';

export const stockInRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/stock-in.page').then(m => m.StockInPage),
  },
];
