export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  price: number;
  createdAt: string;
}

export type NewProduct = Omit<Product, 'id' | 'createdAt'>;
