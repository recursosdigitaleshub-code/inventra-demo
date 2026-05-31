import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryStore } from '../../../core/state/inventory.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { MOVEMENT_LABELS, MovementType, isIncoming } from '../../../core/models/movement.model';

@Component({
  selector: 'inv-movements',
  standalone: true,
  imports: [DatePipe, FormsModule, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Historial de movimientos</h1>
          <div class="page-subtitle">
            {{ filtered().length }} movimiento(s) · inmutables y trazables
          </div>
        </div>
      </div>

      <div class="card">
        <div class="row" style="margin-bottom: 12px">
          <div class="field">
            <select [ngModel]="productFilter()" (ngModelChange)="productFilter.set($event)">
              <option value="">Todos los productos</option>
              @for (p of store.products(); track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
              <option value="">Todos los tipos</option>
              <option value="in">Entradas</option>
              <option value="out">Salidas</option>
              <option value="adjust_neg">Ajustes (−)</option>
              <option value="adjust_pos">Ajustes (+)</option>
            </select>
          </div>
          <div class="spacer"></div>
          <div class="row" style="gap: 8px">
            <span class="badge badge-ok">Entradas: {{ totals().in }}</span>
            <span class="badge badge-warn">Salidas: {{ totals().out }}</span>
            <span class="badge badge-info">Neto: {{ totals().net >= 0 ? '+' : '' }}{{ totals().net }}</span>
          </div>
        </div>

        @if (filtered().length === 0) {
          <inv-empty-state icon="📜" title="Sin movimientos" description="Aún no hay historial con estos filtros." />
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th class="num">Cantidad</th>
                <th class="num">Saldo</th>
                <th>Motivo</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filtered(); track row.id; let i = $index) {
                <tr>
                  <td style="color: var(--text-muted)">{{ filtered().length - i }}</td>
                  <td style="white-space: nowrap">{{ row.createdAt | date: 'dd/MM/yy HH:mm' }}</td>
                  <td>
                    <div style="font-weight: 500">{{ row.productName }}</div>
                    <div style="font-size: 11px; color: var(--text-muted)">{{ row.productSku }}</div>
                  </td>
                  <td>
                    <span class="badge"
                          [class.badge-ok]="row.incoming"
                          [class.badge-warn]="!row.incoming">
                      {{ row.typeLabel }}
                    </span>
                  </td>
                  <td class="num" [style.color]="row.incoming ? 'var(--success)' : 'var(--danger)'"
                      style="font-weight: 600">
                    {{ row.incoming ? '+' : '−' }}{{ row.quantity }}
                  </td>
                  <td class="num">{{ row.runningBalance }}</td>
                  <td>{{ row.reason }}</td>
                  <td style="color: var(--text-muted)">{{ row.reference || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class MovementsPage {
  readonly store = inject(InventoryStore);

  readonly productFilter = signal('');
  readonly typeFilter = signal<'' | MovementType>('');

  readonly filtered = computed(() => {
    const pid = this.productFilter();
    const tp = this.typeFilter();
    const all = [...this.store.movements()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    // compute running balance per product
    const balances: Record<string, number> = {};
    const enriched = all.map(m => {
      balances[m.productId] = (balances[m.productId] ?? 0) + (isIncoming(m.type) ? 1 : -1) * m.quantity;
      const product = this.store.getProduct(m.productId);
      return {
        ...m,
        productName: product?.name ?? '—',
        productSku: product?.sku ?? '',
        typeLabel: MOVEMENT_LABELS[m.type],
        incoming: isIncoming(m.type),
        runningBalance: balances[m.productId],
      };
    });

    return enriched
      .filter(m => (pid ? m.productId === pid : true))
      .filter(m => (tp ? m.type === tp : true))
      .reverse();
  });

  readonly totals = computed(() => {
    const list = this.filtered();
    let inQty = 0, outQty = 0;
    for (const m of list) {
      if (m.incoming) inQty += m.quantity;
      else outQty += m.quantity;
    }
    return { in: inQty, out: outQty, net: inQty - outQty };
  });
}
