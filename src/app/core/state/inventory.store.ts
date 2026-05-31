import { Injectable, computed, signal } from '@angular/core';
import { Movement, MovementType, NewMovement, isIncoming } from '../models/movement.model';
import { NewProduct, Product } from '../models/product.model';

const LS_PRODUCTS = 'inventra.products';
const LS_MOVEMENTS = 'inventra.movements';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function seedProducts(): Product[] {
  const now = new Date().toISOString();
  return [
    { id: uid(), sku: 'ARR-001', name: 'Arroz',  category: 'Abarrotes', unit: 'Kg',      minStock: 20, price: 2.50,  createdAt: now },
    { id: uid(), sku: 'AZU-001', name: 'Azúcar', category: 'Abarrotes', unit: 'Kg',      minStock: 10, price: 3.00,  createdAt: now },
    { id: uid(), sku: 'ACE-001', name: 'Aceite', category: 'Abarrotes', unit: 'Litro',   minStock:  5, price: 7.20,  createdAt: now },
    { id: uid(), sku: 'LEC-001', name: 'Leche',  category: 'Lácteos',   unit: 'Litro',   minStock: 12, price: 4.50,  createdAt: now },
    { id: uid(), sku: 'PAN-001', name: 'Pan',    category: 'Panadería', unit: 'Unidad',  minStock: 30, price: 0.80,  createdAt: now },
  ];
}

@Injectable({ providedIn: 'root' })
export class InventoryStore {
  private readonly _products = signal<Product[]>(loadFromStorage(LS_PRODUCTS, [] as Product[]));
  private readonly _movements = signal<Movement[]>(loadFromStorage(LS_MOVEMENTS, [] as Movement[]));

  readonly products = this._products.asReadonly();
  readonly movements = this._movements.asReadonly();

  readonly categories = computed(() => {
    const set = new Set<string>();
    for (const p of this._products()) set.add(p.category);
    return Array.from(set).sort();
  });

  readonly units = computed(() => {
    const set = new Set<string>();
    for (const p of this._products()) set.add(p.unit);
    return Array.from(set).sort();
  });

  readonly stockByProduct = computed<Record<string, number>>(() => {
    const stock: Record<string, number> = {};
    for (const p of this._products()) stock[p.id] = 0;
    for (const m of this._movements()) {
      if (stock[m.productId] === undefined) stock[m.productId] = 0;
      stock[m.productId] += (isIncoming(m.type) ? 1 : -1) * m.quantity;
    }
    return stock;
  });

  readonly totalUnits = computed(() =>
    Object.values(this.stockByProduct()).reduce((acc, v) => acc + Math.max(0, v), 0)
  );

  readonly lowStockProducts = computed(() => {
    const stock = this.stockByProduct();
    return this._products()
      .filter(p => (stock[p.id] ?? 0) < p.minStock)
      .map(p => ({ ...p, current: stock[p.id] ?? 0, missing: p.minStock - (stock[p.id] ?? 0) }));
  });

  readonly recentMovements = computed(() =>
    [...this._movements()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
  );

  constructor() {
    if (this._products().length === 0) {
      const seeded = seedProducts();
      this._products.set(seeded);
      saveToStorage(LS_PRODUCTS, seeded);
    }
  }

  // ---------- Products

  getProduct(id: string): Product | undefined {
    return this._products().find(p => p.id === id);
  }

  stockOf(productId: string): number {
    return this.stockByProduct()[productId] ?? 0;
  }

  skuExists(sku: string, excludeId?: string): boolean {
    const needle = sku.trim().toLowerCase();
    return this._products().some(p => p.sku.toLowerCase() === needle && p.id !== excludeId);
  }

  createProduct(input: NewProduct): Product {
    if (this.skuExists(input.sku)) {
      throw new Error(`Ya existe un producto con SKU "${input.sku}".`);
    }
    const product: Product = { ...input, id: uid(), createdAt: new Date().toISOString() };
    this._products.update(list => [...list, product]);
    saveToStorage(LS_PRODUCTS, this._products());
    return product;
  }

  updateProduct(id: string, patch: Partial<NewProduct>): Product {
    if (patch.sku && this.skuExists(patch.sku, id)) {
      throw new Error(`Ya existe otro producto con SKU "${patch.sku}".`);
    }
    let updated: Product | undefined;
    this._products.update(list => list.map(p => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch };
      return updated;
    }));
    if (!updated) throw new Error('Producto no encontrado.');
    saveToStorage(LS_PRODUCTS, this._products());
    return updated;
  }

  archiveProduct(id: string): void {
    const hasMovements = this._movements().some(m => m.productId === id);
    if (hasMovements) {
      throw new Error('No se puede eliminar un producto con movimientos. Use archivar.');
    }
    this._products.update(list => list.filter(p => p.id !== id));
    saveToStorage(LS_PRODUCTS, this._products());
  }

  // ---------- Movements

  registerMovement(input: NewMovement): Movement {
    if (input.quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0.');
    }
    const product = this.getProduct(input.productId);
    if (!product) {
      throw new Error('Producto no encontrado.');
    }

    const delta = isIncoming(input.type) ? input.quantity : -input.quantity;
    const projected = this.stockOf(product.id) + delta;
    if (projected < 0) {
      throw new Error(
        `Stock insuficiente para "${product.name}". Disponible: ${this.stockOf(product.id)} ${product.unit}, solicitado: ${input.quantity} ${product.unit}.`
      );
    }

    const movement: Movement = { ...input, id: uid(), createdAt: new Date().toISOString() };
    this._movements.update(list => [...list, movement]);
    saveToStorage(LS_MOVEMENTS, this._movements());
    return movement;
  }

  movementsByProduct(productId: string): Movement[] {
    return this._movements()
      .filter(m => m.productId === productId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // ---------- Demo helpers

  resetDemo(): void {
    const seeded = seedProducts();
    this._products.set(seeded);
    this._movements.set([]);
    saveToStorage(LS_PRODUCTS, seeded);
    saveToStorage(LS_MOVEMENTS, []);
  }
}
