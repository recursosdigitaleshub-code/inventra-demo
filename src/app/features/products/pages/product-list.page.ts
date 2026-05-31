import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '../../../core/state/inventory.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ToastService } from '../../../shared/ui/toast.service';

@Component({
  selector: 'inv-product-list',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Productos</h1>
          <div class="page-subtitle">{{ store.products().length }} producto(s) · {{ store.totalUnits() }} unidad(es) en stock</div>
        </div>
        <a routerLink="/products/new" class="btn btn-primary">+ Nuevo producto</a>
      </div>

      <div class="card">
        <div class="row" style="margin-bottom: 12px">
          <div class="field" style="flex: 1; min-width: 200px">
            <input
              type="search"
              placeholder="Buscar por nombre, SKU o categoría…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)" />
          </div>
          <div class="field">
            <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)">
              <option value="">Todas las categorías</option>
              @for (c of store.categories(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </div>
          <div class="field">
            <select [ngModel]="stockFilter()" (ngModelChange)="stockFilter.set($event)">
              <option value="all">Todo el stock</option>
              <option value="low">Bajo mínimo</option>
              <option value="ok">Sobre mínimo</option>
              <option value="zero">Sin stock</option>
            </select>
          </div>
        </div>

        @if (filtered().length === 0) {
          <inv-empty-state
            icon="🔍"
            title="Sin resultados"
            description="Ajusta los filtros o crea un nuevo producto." />
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th class="num">Stock actual</th>
                <th class="num">Stock mínimo</th>
                <th>Estado</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtered(); track p.id) {
                <tr>
                  <td><code>{{ p.sku }}</code></td>
                  <td style="font-weight: 500">{{ p.name }}</td>
                  <td>{{ p.category }}</td>
                  <td>{{ p.unit }}</td>
                  <td class="num" [style.fontWeight]="p.current < p.minStock ? 600 : 400"
                      [style.color]="p.current === 0 ? 'var(--danger)' : (p.current < p.minStock ? 'var(--warning)' : 'var(--text)')">
                    {{ p.current }}
                  </td>
                  <td class="num">{{ p.minStock }}</td>
                  <td>
                    @if (p.current === 0) {
                      <span class="badge badge-danger">Sin stock</span>
                    } @else if (p.current < p.minStock) {
                      <span class="badge badge-warn">Bajo mínimo</span>
                    } @else {
                      <span class="badge badge-ok">OK</span>
                    }
                  </td>
                  <td style="color: var(--text-muted)">{{ p.createdAt | date: 'dd/MM/yy' }}</td>
                  <td>
                    <div class="row" style="gap: 4px">
                      <a [routerLink]="['/products', p.id, 'edit']" class="btn btn-sm">Editar</a>
                      <button class="btn btn-sm" (click)="archive(p.id, p.name)">Eliminar</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class ProductListPage {
  readonly store = inject(InventoryStore);
  private readonly toast = inject(ToastService);

  readonly query = signal('');
  readonly categoryFilter = signal('');
  readonly stockFilter = signal<'all' | 'low' | 'ok' | 'zero'>('all');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.categoryFilter();
    const s = this.stockFilter();
    const stockMap = this.store.stockByProduct();
    return this.store.products()
      .map(p => ({ ...p, current: stockMap[p.id] ?? 0 }))
      .filter(p => {
        if (q && !(p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))) return false;
        if (cat && p.category !== cat) return false;
        if (s === 'low' && p.current >= p.minStock) return false;
        if (s === 'ok' && p.current < p.minStock) return false;
        if (s === 'zero' && p.current !== 0) return false;
        return true;
      });
  });

  archive(id: string, name: string) {
    if (!confirm(`¿Eliminar el producto "${name}"?`)) return;
    try {
      this.store.archiveProduct(id);
      this.toast.success(`Producto "${name}" eliminado.`);
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
  }
}
