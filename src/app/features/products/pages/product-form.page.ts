import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InventoryStore } from '../../../core/state/inventory.store';
import { ToastService } from '../../../shared/ui/toast.service';

@Component({
  selector: 'inv-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page" style="max-width: 760px">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ editingId() ? 'Editar producto' : 'Nuevo producto' }}</h1>
          <div class="page-subtitle">Completa los datos del catálogo.</div>
        </div>
        <a routerLink="/products" class="btn">← Volver</a>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="card">
        <div class="form-grid">
          <div class="field" [class.invalid]="showError('sku')">
            <label class="required">SKU</label>
            <input formControlName="sku" placeholder="Ej: AZU-001" />
            @if (showError('sku')) {
              <div class="error">
                @if (form.controls.sku.errors?.['required']) { SKU es obligatorio. }
                @else if (form.controls.sku.errors?.['duplicate']) { Ya existe un producto con este SKU. }
              </div>
            }
          </div>

          <div class="field" [class.invalid]="showError('name')">
            <label class="required">Nombre</label>
            <input formControlName="name" placeholder="Ej: Azúcar" />
            @if (showError('name')) { <div class="error">El nombre es obligatorio.</div> }
          </div>

          <div class="field" [class.invalid]="showError('category')">
            <label class="required">Categoría</label>
            <input formControlName="category" placeholder="Ej: Abarrotes" list="category-list" />
            <datalist id="category-list">
              @for (c of store.categories(); track c) { <option [value]="c"></option> }
            </datalist>
            @if (showError('category')) { <div class="error">La categoría es obligatoria.</div> }
          </div>

          <div class="field" [class.invalid]="showError('unit')">
            <label class="required">Unidad de medida</label>
            <input formControlName="unit" placeholder="Ej: Kg, Unidad, Litro" list="unit-list" />
            <datalist id="unit-list">
              @for (u of store.units(); track u) { <option [value]="u"></option> }
            </datalist>
            @if (showError('unit')) { <div class="error">La unidad es obligatoria.</div> }
          </div>

          <div class="field" [class.invalid]="showError('minStock')">
            <label class="required">Stock mínimo</label>
            <input type="number" min="0" step="1" formControlName="minStock" />
            <div class="hint">Dispara alerta si el stock cae por debajo.</div>
            @if (showError('minStock')) {
              <div class="error">
                @if (form.controls.minStock.errors?.['required']) { Requerido. }
                @else if (form.controls.minStock.errors?.['min']) { Debe ser 0 o mayor. }
              </div>
            }
          </div>

          <div class="field" [class.invalid]="showError('price')">
            <label>Precio unitario</label>
            <input type="number" min="0" step="0.01" formControlName="price" />
            <div class="hint">Opcional. Usado para valorización.</div>
            @if (showError('price')) { <div class="error">Debe ser 0 o mayor.</div> }
          </div>

          @if (editingId()) {
            <div class="field">
              <label>Stock actual</label>
              <input [value]="currentStock()" disabled />
              <div class="hint">Se modifica solo con movimientos (entradas/salidas/ajustes).</div>
            </div>
          } @else {
            <div class="field">
              <label>Stock inicial</label>
              <input type="number" min="0" step="1" formControlName="initialStock" />
              <div class="hint">Genera una entrada inicial automática si es mayor a 0.</div>
            </div>
          }
        </div>

        <div class="row" style="margin-top: 20px; justify-content: flex-end">
          <a routerLink="/products" class="btn">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Guardando…' : (editingId() ? 'Guardar cambios' : 'Crear producto') }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProductFormPage {
  readonly store = inject(InventoryStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    sku:          ['', [Validators.required]],
    name:         ['', [Validators.required]],
    category:     ['', [Validators.required]],
    unit:         ['', [Validators.required]],
    minStock:     [0, [Validators.required, Validators.min(0)]],
    price:        [0, [Validators.min(0)]],
    initialStock: [0, [Validators.min(0)]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const p = this.store.getProduct(id);
      if (!p) {
        this.toast.error('Producto no encontrado.');
        this.router.navigate(['/products']);
        return;
      }
      this.editingId.set(id);
      this.form.patchValue({
        sku: p.sku, name: p.name, category: p.category,
        unit: p.unit, minStock: p.minStock, price: p.price,
      });
      this.form.controls.initialStock.disable();
    }
  }

  currentStock(): number {
    const id = this.editingId();
    return id ? this.store.stockOf(id) : 0;
  }

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
      const id = this.editingId();
      if (id) {
        this.store.updateProduct(id, {
          sku: v.sku, name: v.name, category: v.category,
          unit: v.unit, minStock: Number(v.minStock), price: Number(v.price),
        });
        this.toast.success(`"${v.name}" actualizado.`);
      } else {
        const created = this.store.createProduct({
          sku: v.sku, name: v.name, category: v.category,
          unit: v.unit, minStock: Number(v.minStock), price: Number(v.price),
        });
        if (v.initialStock > 0) {
          this.store.registerMovement({
            productId: created.id,
            type: 'in',
            quantity: Number(v.initialStock),
            reason: 'Stock inicial',
            reference: 'INI-' + created.sku,
          });
        }
        this.toast.success(`"${v.name}" creado.`);
      }
      this.router.navigate(['/products']);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.';
      this.toast.error(msg);
      if (msg.toLowerCase().includes('sku')) {
        this.form.controls.sku.setErrors({ duplicate: true });
      }
    } finally {
      this.saving.set(false);
    }
  }
}
