import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes),
  },
  {
    path: 'stock-in',
    loadChildren: () => import('./features/stock-in/stock-in.routes').then(m => m.stockInRoutes),
  },
  {
    path: 'stock-out',
    loadChildren: () => import('./features/stock-out/stock-out.routes').then(m => m.stockOutRoutes),
  },
  {
    path: 'movements',
    loadChildren: () => import('./features/movements/movements.routes').then(m => m.movementsRoutes),
  },
  {
    path: 'alerts',
    loadChildren: () => import('./features/alerts/alerts.routes').then(m => m.alertsRoutes),
  },
  { path: '**', redirectTo: 'dashboard' },
];
