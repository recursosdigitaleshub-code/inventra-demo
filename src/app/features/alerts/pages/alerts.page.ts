import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '../../../core/state/inventory.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';

@Component({
  selector: 'inv-alerts',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Alertas de stock</h1>
          <div class="page-subtitle">Productos cuyo stock cayó bajo el mínimo configurado.</div>
        </div>
        <div class="row">
          <span class="badge" [class.badge-ok]="alerts().length === 0" [class.badge-danger]="alerts().length > 0">
            {{ alerts().length }} alerta(s)
          </span>
          <a routerLink="/stock-in" class="btn btn-primary">⬇️ Registrar entrada</a>
        </div>
      </div>

      @if (alerts().length === 0) {
        <section class="card">
          <inv-empty-state icon="✅" title="Todo en orden" description="Ningún producto está bajo el mínimo configurado." />
        </section>
      } @else {
        <section class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th class="num">Stock actual</th>
                <th class="num">Stock mínimo</th>
                <th class="num">Faltante</th>
                <th>Cobertura</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              @for (a of alerts(); track a.id) {
                <tr>
                  <td>
                    <div style="font-weight: 500">{{ a.name }}</div>
                    <div style="font-size: 11px; color: var(--text-muted)">{{ a.sku }}</div>
                  </td>
                  <td>{{ a.category }}</td>
                  <td class="num" [style.color]="a.current === 0 ? 'var(--danger)' : 'var(--warning)'"
                      style="font-weight: 600">{{ a.current }} {{ a.unit }}</td>
                  <td class="num">{{ a.minStock }} {{ a.unit }}</td>
                  <td class="num" style="color: var(--danger); font-weight: 600">{{ a.missing }}</td>
                  <td>
                    <div style="background: var(--surface-3); border-radius: 999px; height: 6px; overflow: hidden; width: 100px">
                      <div [style.width.%]="coveragePct(a)" [style.background]="a.current === 0 ? 'var(--danger)' : 'var(--warning)'" style="height: 100%"></div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px">{{ coveragePct(a) }}%</div>
                  </td>
                  <td><a routerLink="/stock-in" class="btn btn-sm btn-primary">Reponer</a></td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }
    </div>
  `,
})
export class AlertsPage {
  private readonly store = inject(InventoryStore);
  readonly alerts = this.store.lowStockProducts;

  coveragePct(a: { current: number; minStock: number }): number {
    if (a.minStock === 0) return 100;
    return Math.min(100, Math.round((a.current / a.minStock) * 100));
  }
}
