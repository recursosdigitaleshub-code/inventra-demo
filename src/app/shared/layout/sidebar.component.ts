import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { InventoryStore } from '../../core/state/inventory.store';

interface NavItem { path: string; label: string; icon: string; badge?: () => number | string; }

@Component({
  selector: 'inv-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-icon">📦</span>
        <div>
          <div class="brand-title">Inventra AI</div>
          <div class="brand-sub">Tienda demo</div>
        </div>
      </div>
      <nav class="nav">
        @for (item of items; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            @if (item.path === 'alerts' && lowCount() > 0) {
              <span class="nav-badge">{{ lowCount() }}</span>
            }
          </a>
        }
      </nav>
      <div class="sidebar-footer">
        <button class="btn btn-ghost btn-sm" (click)="reset()">🔄 Reiniciar demo</button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 240px; min-width: 240px; background: #0f172a; color: #e2e8f0;
      display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0;
    }
    .brand { display: flex; gap: 10px; align-items: center; padding: 20px 16px; border-bottom: 1px solid #1e293b; }
    .brand-icon { font-size: 24px; }
    .brand-title { font-weight: 700; font-size: 15px; }
    .brand-sub { font-size: 11px; color: #94a3b8; }
    .nav { display: flex; flex-direction: column; gap: 2px; padding: 16px 8px; flex: 1; }
    .nav-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px;
      color: #cbd5e1; text-decoration: none; font-size: 14px; position: relative;
    }
    .nav-item:hover { background: #1e293b; color: #fff; text-decoration: none; }
    .nav-item.active { background: #2563eb; color: #fff; font-weight: 500; }
    .nav-icon { width: 18px; text-align: center; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: #dc2626; color: #fff; font-size: 11px; padding: 1px 7px;
      border-radius: 999px; font-weight: 600;
    }
    .sidebar-footer { padding: 12px; border-top: 1px solid #1e293b; }
    .sidebar-footer .btn { width: 100%; color: #cbd5e1; }
    .sidebar-footer .btn:hover { background: #1e293b; color: #fff; }
  `],
})
export class SidebarComponent {
  private readonly store = inject(InventoryStore);
  readonly items: NavItem[] = [
    { path: 'dashboard',  label: 'Dashboard',  icon: '🏠' },
    { path: 'products',   label: 'Productos',  icon: '📋' },
    { path: 'stock-in',   label: 'Entradas',   icon: '⬇️' },
    { path: 'stock-out',  label: 'Salidas',    icon: '⬆️' },
    { path: 'movements',  label: 'Movimientos',icon: '📜' },
    { path: 'alerts',     label: 'Alertas',    icon: '🔔' },
  ];

  lowCount(): number { return this.store.lowStockProducts().length; }

  reset() {
    if (confirm('¿Reiniciar datos demo? Se borrarán productos y movimientos actuales.')) {
      this.store.resetDemo();
      location.reload();
    }
  }
}
