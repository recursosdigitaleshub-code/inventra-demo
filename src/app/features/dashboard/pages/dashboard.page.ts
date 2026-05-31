import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '../../../core/state/inventory.store';
import { StatCardComponent } from '../../../shared/ui/stat-card.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { MOVEMENT_LABELS, isIncoming } from '../../../core/models/movement.model';

@Component({
  selector: 'inv-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink, StatCardComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <div class="page-subtitle">Panorama de inventario en tiempo real.</div>
        </div>
        <div class="row">
          <a routerLink="/stock-in" class="btn">⬇️ Nueva entrada</a>
          <a routerLink="/stock-out" class="btn btn-primary">⬆️ Nueva salida</a>
        </div>
      </div>

      <div class="grid grid-4">
        <inv-stat-card label="Productos activos" [value]="store.products().length" tone="default" hint="Catálogo total" />
        <inv-stat-card label="Unidades en stock" [value]="store.totalUnits()" tone="ok" hint="Suma de existencias positivas" />
        <inv-stat-card label="Movimientos registrados" [value]="store.movements().length" tone="default" hint="Histórico completo" />
        <inv-stat-card
          label="Productos en alerta"
          [value]="lowCount()"
          [tone]="lowCount() > 0 ? 'alert' : 'ok'"
          [hint]="lowCount() > 0 ? 'Requieren reposición' : 'Todo bajo control'" />
      </div>

      <div class="grid grid-2" style="margin-top: 16px">
        <section class="card">
          <div class="row-between" style="margin-bottom: 12px">
            <h2>Productos con stock bajo</h2>
            <a routerLink="/alerts" class="btn btn-sm">Ver todas</a>
          </div>
          @if (store.lowStockProducts().length === 0) {
            <inv-empty-state icon="✅" title="Sin alertas" description="Ningún producto está bajo el mínimo." />
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="num">Stock</th>
                  <th class="num">Mínimo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (p of store.lowStockProducts(); track p.id) {
                  <tr>
                    <td>
                      <div style="font-weight: 500">{{ p.name }}</div>
                      <div style="font-size: 11px; color: var(--text-muted)">{{ p.sku }}</div>
                    </td>
                    <td class="num">{{ p.current }} {{ p.unit }}</td>
                    <td class="num">{{ p.minStock }} {{ p.unit }}</td>
                    <td><span class="badge badge-danger">Reponer {{ p.missing }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>

        <section class="card">
          <div class="row-between" style="margin-bottom: 12px">
            <h2>Últimos movimientos</h2>
            <a routerLink="/movements" class="btn btn-sm">Ver historial</a>
          </div>
          @if (store.recentMovements().length === 0) {
            <inv-empty-state icon="📭" title="Sin movimientos" description="Aún no se han registrado entradas ni salidas." />
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th class="num">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                @for (m of store.recentMovements(); track m.id) {
                  <tr>
                    <td style="white-space: nowrap">{{ m.createdAt | date: 'dd/MM HH:mm' }}</td>
                    <td>{{ productName(m.productId) }}</td>
                    <td>
                      <span class="badge" [class.badge-ok]="incoming(m.type)" [class.badge-warn]="!incoming(m.type)">
                        {{ label(m.type) }}
                      </span>
                    </td>
                    <td class="num">{{ incoming(m.type) ? '+' : '−' }}{{ m.quantity }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      </div>
    </div>
  `,
})
export class DashboardPage {
  readonly store = inject(InventoryStore);

  lowCount() { return this.store.lowStockProducts().length; }
  productName(id: string) { return this.store.getProduct(id)?.name ?? '—'; }
  label(t: 'in' | 'out' | 'adjust_neg' | 'adjust_pos') { return MOVEMENT_LABELS[t]; }
  incoming(t: 'in' | 'out' | 'adjust_neg' | 'adjust_pos') { return isIncoming(t); }
}
