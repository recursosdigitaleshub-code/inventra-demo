import { Routes } from '@angular/router';

export const stockOutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/stock-out.page').then(m => m.StockOutPage),
  },
];
