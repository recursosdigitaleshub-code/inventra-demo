import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryStore } from '../../../core/state/inventory.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { MovementType } from '../../../core/models/movement.model';

@Component({
  selector: 'inv-stock-out',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, EmptyStateComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Salidas de inventario</h1>
          <div class="page-subtitle">Registra ventas, consumos, mermas o ajustes negativos.</div>
        </div>
        <a routerLink="/movements" class="btn">Ver historial completo</a>
      </div>

      <div class="grid grid-2">
        <section class="card">
          <h2>Nueva salida</h2>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-grid">
              <div class="field" [class.invalid]="showError('productId')">
                <label class="required">Producto</label>
                <select formControlName="productId">
                  <option value="">Seleccionar…</option>
                  @for (p of store.products(); track p.id) {
                    <option [value]="p.id">{{ p.name }} ({{ p.sku }}) · stock {{ store.stockOf(p.id) }}</option>
                  }
                </select>
                @if (showError('productId')) { <div class="error">Selecciona un producto.</div> }
                @if (selectedProduct(); as p) {
                  <div class="hint">
                    Disponible: <strong>{{ store.stockOf(p.id) }} {{ p.unit }}</strong>
                    · Mínimo: {{ p.minStock }}
                  </div>
                }
              </div>

              <div class="field" [class.invalid]="showError('quantity') || exceedsStock()">
                <label class="required">Cantidad</label>
                <input type="number" min="1" step="1" formControlName="quantity" />
                @if (showError('quantity')) {
                  <div class="error">
                    @if (form.controls.quantity.errors?.['required']) { Requerido. }
                    @else if (form.controls.quantity.errors?.['min']) { Debe ser mayor a 0. }
                  </div>
                }
                @if (exceedsStock()) {
                  <div class="error">
                    Stock insuficiente. Disponible: {{ store.stockOf(form.controls.productId.value) }}.
                  </div>
                }
              </div>

              <div class="field" [class.invalid]="showError('reason')">
                <label class="required">Motivo</label>
                <select formControlName="reason" (change)="onReasonChange()">
                  <option value="">Seleccionar…</option>
                  <option value="Venta">Venta</option>
                  <option value="Consumo interno">Consumo interno</option>
                  <option value="Merma / daño">Merma / daño</option>
                  <option value="Devolución a proveedor">Devolución a proveedor</option>
                  <option value="Ajuste por conteo">Ajuste por conteo (-)</option>
                  <option value="Otro">Otro</option>
                </select>
                @if (showError('reason')) { <div class="error">Selecciona un motivo.</div> }
              </div>

              <div class="field">
                <label>Referencia / documento</label>
                <input formControlName="reference" placeholder="Ej: VTA-001" />
              </div>
            </div>

            <div class="row" style="margin-top: 16px; justify-content: flex-end">
              <button type="submit" class="btn btn-primary"
                      [disabled]="form.invalid || exceedsStock() || saving()">
                {{ saving() ? 'Registrando…' : '⬆️ Registrar salida' }}
              </button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>Últimas salidas</h2>
          @if (recentOuts().length === 0) {
            <inv-empty-state icon="⬆️" title="Sin salidas aún" description="Registra tu primera salida." />
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
                @for (m of recentOuts(); track m.id) {
                  <tr>
                    <td style="white-space: nowrap">{{ m.createdAt | date: 'dd/MM HH:mm' }}</td>
                    <td>{{ productName(m.productId) }}</td>
                    <td class="num" style="color: var(--danger); font-weight: 600">−{{ m.quantity }}</td>
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
export class StockOutPage {
  readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    productId: ['', [Validators.required]],
    quantity:  [1,  [Validators.required, Validators.min(1)]],
    reason:    ['', [Validators.required]],
    reference: [''],
  });

  readonly selectedProduct = computed(() => {
    const id = this.form.controls.productId.value;
    return id ? this.store.getProduct(id) : undefined;
  });

  readonly exceedsStock = computed(() => {
    const id = this.form.controls.productId.value;
    const qty = Number(this.form.controls.quantity.value ?? 0);
    if (!id || qty <= 0) return false;
    return qty > this.store.stockOf(id);
  });

  readonly recentOuts = computed(() =>
    [...this.store.movements()]
      .filter(m => m.type === 'out' || m.type === 'adjust_neg')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
  );

  productName(id: string) { return this.store.getProduct(id)?.name ?? '—'; }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  onReasonChange() { /* placeholder; kept to allow future reason-dependent logic */ }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.exceedsStock()) return;
    const v = this.form.getRawValue();
    const type: MovementType = v.reason === 'Ajuste por conteo' ? 'adjust_neg' : 'out';
    this.saving.set(true);
    try {
      this.store.registerMovement({
        productId: v.productId,
        type,
        quantity: Number(v.quantity),
        reason: v.reason,
        reference: v.reference || undefined,
      });
      this.toast.success(`Salida de ${v.quantity} unidad(es) registrada.`);
      this.form.reset({ productId: '', quantity: 1, reason: '', reference: '' });
    } catch (e: unknown) {
      this.toast.error(e instanceof Error ? e.message : 'No se pudo registrar la salida.');
    } finally {
      this.saving.set(false);
    }
  }
}
