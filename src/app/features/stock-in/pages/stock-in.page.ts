import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '../../../core/state/inventory.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ToastService } from '../../../shared/ui/toast.service';

@Component({
  selector: 'inv-stock-in',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Entradas de inventario</h1>
          <div class="page-subtitle">Registra ingresos por compra, producción o devolución.</div>
        </div>
        <a routerLink="/movements" class="btn">Ver historial completo</a>
      </div>

      <div class="grid grid-2">
        <section class="card">
          <h2>Nueva entrada</h2>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-grid">
              <div class="field" [class.invalid]="showError('productId')">
                <label class="required">Producto</label>
                <select formControlName="productId">
                  <option value="">Seleccionar…</option>
                  @for (p of store.products(); track p.id) {
                    <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                  }
                </select>
                @if (showError('productId')) { <div class="error">Selecciona un producto.</div> }
                @if (selectedProduct(); as p) {
                  <div class="hint">Stock actual: <strong>{{ store.stockOf(p.id) }} {{ p.unit }}</strong></div>
                }
              </div>

              <div class="field" [class.invalid]="showError('quantity')">
                <label class="required">Cantidad</label>
                <input type="number" min="1" step="1" formControlName="quantity" />
                @if (showError('quantity')) {
                  <div class="error">
                    @if (form.controls.quantity.errors?.['required']) { Requerido. }
                    @else if (form.controls.quantity.errors?.['min']) { Debe ser mayor a 0. }
                  </div>
                }
              </div>

              <div class="field">
                <label>Costo unitario</label>
                <input type="number" min="0" step="0.01" formControlName="unitCost" />
                <div class="hint">Opcional.</div>
              </div>

              <div class="field" [class.invalid]="showError('reason')">
                <label class="required">Motivo</label>
                <select formControlName="reason">
                  <option value="">Seleccionar…</option>
                  <option value="Compra">Compra</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                  <option value="Producción">Producción</option>
                  <option value="Ajuste por conteo">Ajuste por conteo</option>
                  <option value="Otro">Otro</option>
                </select>
                @if (showError('reason')) { <div class="error">Selecciona un motivo.</div> }
              </div>

              <div class="field">
                <label>Referencia / documento</label>
                <input formControlName="reference" placeholder="Ej: COMP-001" />
              </div>
            </div>

            <div class="row" style="margin-top: 16px; justify-content: flex-end">
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Registrando…' : '⬇️ Registrar entrada' }}
              </button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>Últimas entradas</h2>
          @if (recentIns().length === 0) {
            <inv-empty-state icon="⬇️" title="Sin entradas aún" description="Registra la primera entrada del día." />
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th class="num">Cantidad</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                @for (m of recentIns(); track m.id) {
                  <tr>
                    <td style="white-space: nowrap">{{ m.createdAt | date: 'dd/MM HH:mm' }}</td>
                    <td>{{ productName(m.productId) }}</td>
                    <td class="num" style="color: var(--success); font-weight: 600">+{{ m.quantity }}</td>
                    <td>{{ m.reason }}</td>
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
export class StockInPage {
  readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    productId: ['', [Validators.required]],
    quantity:  [1,  [Validators.required, Validators.min(1)]],
    unitCost:  [0,  [Validators.min(0)]],
    reason:    ['', [Validators.required]],
    reference: [''],
  });

  readonly selectedProduct = computed(() => {
    const id = this.form.controls.productId.value;
    return id ? this.store.getProduct(id) : undefined;
  });

  readonly recentIns = computed(() =>
    [...this.store.movements()]
      .filter(m => m.type === 'in')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
  );

  productName(id: string) { return this.store.getProduct(id)?.name ?? '—'; }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    try {
      this.store.registerMovement({
        productId: v.productId,
        type: 'in',
        quantity: Number(v.quantity),
        reason: v.reason,
        unitCost: v.unitCost ? Number(v.unitCost) : undefined,
        reference: v.reference || undefined,
      });
      this.toast.success(`Entrada de ${v.quantity} unidad(es) registrada.`);
      this.form.reset({ productId: '', quantity: 1, unitCost: 0, reason: '', reference: '' });
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : 'No se pudo registrar la entrada.');
    } finally {
      this.saving.set(false);
    }
  }
}
