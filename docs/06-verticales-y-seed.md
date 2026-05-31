# 06 · Verticales y catálogo semilla

Inventra se configura al onboarding según el **tipo de negocio** del tenant. Este documento define los 6 verticales soportados en el MVP, sus catálogos pre-cargados, categorías y unidades sugeridas.

---

## Verticales soportadas (MVP)

| Código | Icon | Nombre | Descripción |
|--------|------|--------|-------------|
| `retail` | 🏪 | Tienda | Abarrotes, minimarket |
| `bakery` | 🧁 | Repostería | Insumos y productos horneados |
| `hardware` | 🔧 | Ferretería | Herramientas y materiales |
| `pharmacy` | 💊 | Farmacia | Medicamentos con lote (lote + vencimiento en v2) |
| `petshop` | 🐾 | Mascotas | Alimento y accesorios |
| `other` | 📦 | Otro | Configuración personalizada (requiere descripción) |

---

## Catálogo semilla por vertical

Cada vertical (excepto `other`) incluye **8 productos típicos** pre-cargados en el onboarding. El usuario puede editarlos, eliminarlos o agregarlos antes de finalizar.

**Nota sobre precios**: los valores de los catálogos semilla están expresados en una escala pensada para USD/pesos "pequeños" a efectos de demo. En el sistema real, el backend **debe** aceptar los precios tal cual los ingresa el usuario (puede ser en COP con valores como 2.400, 3.500, 85.000, etc.).

### Retail (Tienda)

Prefijo SKU: varios (ARR-, AZU-, ACE-, LEC-, PAN-, GAS-, JAB-, PAP-).

| SKU | Nombre | Categoría | Unidad | Mín | Precio | Stock |
|-----|--------|-----------|--------|-----|--------|-------|
| ARR-001 | Arroz 1kg | Abarrotes | Kg | 20 | 2.50 | 60 |
| AZU-001 | Azúcar blanca 1kg | Abarrotes | Kg | 10 | 3.00 | 35 |
| ACE-001 | Aceite vegetal 1L | Abarrotes | Litro | 5 | 7.20 | 18 |
| LEC-001 | Leche entera | Lácteos | Litro | 12 | 4.50 | 30 |
| PAN-001 | Pan blanco | Panadería | Unidad | 30 | 0.80 | 80 |
| GAS-001 | Gaseosa 2L | Bebidas | Unidad | 15 | 3.50 | 40 |
| JAB-001 | Jabón en polvo 1kg | Aseo | Unidad | 10 | 5.80 | 22 |
| PAP-001 | Papel higiénico 4 rollos | Aseo | Paquete | 12 | 4.00 | 28 |

### Bakery (Repostería)

Prefijos: HAR-, AZU-, HUE-, MAN-, LEC-, VAI-, CHO-, PHO-.

| SKU | Nombre | Categoría | Unidad | Mín | Precio | Stock |
|-----|--------|-----------|--------|-----|--------|-------|
| HAR-001 | Harina de trigo | Insumos secos | Kg | 5 | 2.00 | 25 |
| AZU-001 | Azúcar blanca | Insumos secos | Kg | 5 | 3.00 | 18 |
| HUE-001 | Huevos | Frescos | Unidad | 30 | 0.35 | 120 |
| MAN-001 | Mantequilla | Lácteos | Kg | 2 | 8.00 | 6 |
| LEC-001 | Leche entera | Lácteos | Litro | 6 | 4.50 | 20 |
| VAI-001 | Esencia de vainilla | Saborizantes | ml | 100 | 0.05 | 500 |
| CHO-001 | Chocolate cobertura | Saborizantes | Kg | 2 | 15.00 | 5 |
| PHO-001 | Polvo para hornear | Insumos secos | Kg | 1 | 10.00 | 3 |

### Hardware (Ferretería)

Prefijos: TOR-, TUE-, MAR-, DES-, PIN-, CAB-, BOM-, TUB-.

| SKU | Nombre | Categoría | Unidad | Mín | Precio | Stock |
|-----|--------|-----------|--------|-----|--------|-------|
| TOR-001 | Tornillo 1/4" x 1" | Tornillería | Unidad | 100 | 0.10 | 500 |
| TUE-001 | Tuerca 1/4" | Tornillería | Unidad | 100 | 0.05 | 400 |
| MAR-001 | Martillo 16oz | Herramientas | Unidad | 5 | 25.00 | 12 |
| DES-001 | Destornillador Phillips | Herramientas | Unidad | 5 | 12.00 | 15 |
| PIN-001 | Pintura blanca 1L | Pinturas | Litro | 5 | 18.00 | 20 |
| CAB-001 | Cable eléctrico #12 | Eléctricos | Metro | 50 | 1.50 | 200 |
| BOM-001 | Bombilla LED 9W | Iluminación | Unidad | 10 | 5.00 | 30 |
| TUB-001 | Tubo PVC 1/2" | Plomería | Metro | 20 | 2.00 | 80 |

### Pharmacy (Farmacia)

Prefijos: MED-, VIT-, HIG-, INS-.

| SKU | Nombre | Categoría | Unidad | Mín | Precio | Stock |
|-----|--------|-----------|--------|-----|--------|-------|
| MED-001 | Acetaminofén 500mg | Analgésicos | Caja | 10 | 4.50 | 35 |
| MED-002 | Ibuprofeno 400mg | Analgésicos | Caja | 10 | 5.80 | 28 |
| MED-003 | Loratadina 10mg | Antihistamínicos | Caja | 8 | 6.20 | 15 |
| MED-004 | Amoxicilina 500mg | Antibióticos | Caja | 5 | 12.00 | 10 |
| VIT-001 | Vitamina C 1000mg | Vitaminas | Frasco | 8 | 15.00 | 20 |
| HIG-001 | Alcohol 70% 250ml | Higiene personal | Frasco | 15 | 3.50 | 40 |
| HIG-002 | Jabón antibacterial | Higiene personal | Unidad | 20 | 2.80 | 55 |
| INS-001 | Termómetro digital | Instrumentos | Unidad | 3 | 18.00 | 8 |

**Nota importante**: en v2, farmacia requiere manejo de **lote y fecha de vencimiento**. El MVP no lo tiene, pero el modelo de datos **debería** reservar campos opcionales `lot` y `expiresAt` en `Movement` y `Product` para facilitar la migración.

### Petshop (Mascotas)

Prefijos: ALI-, COL-, COR-, ARE-, SHA-, JUG-, ANT-.

| SKU | Nombre | Categoría | Unidad | Mín | Precio | Stock |
|-----|--------|-----------|--------|-----|--------|-------|
| ALI-001 | Alimento perro adulto 15kg | Alimento perros | Bolsa | 5 | 85.00 | 12 |
| ALI-002 | Alimento gato adulto 10kg | Alimento gatos | Bolsa | 5 | 70.00 | 10 |
| COL-001 | Collar mediano | Accesorios | Unidad | 6 | 12.00 | 18 |
| COR-001 | Correa extensible | Accesorios | Unidad | 4 | 25.00 | 9 |
| ARE-001 | Arena sanitaria 5kg | Higiene | Bolsa | 8 | 15.00 | 20 |
| SHA-001 | Shampoo para perro | Higiene | Frasco | 6 | 18.00 | 12 |
| JUG-001 | Pelota de juguete | Juguetes | Unidad | 10 | 8.00 | 25 |
| ANT-001 | Antipulgas tabletas | Salud animal | Caja | 5 | 22.00 | 10 |

### Other (Personalizada)

- Sin catálogo pre-cargado.
- Sin categorías ni unidades sugeridas.
- Requiere `tenant.customVerticalName` (descripción corta del negocio).
- El usuario agrega productos, categorías y unidades manualmente.

---

## Listas sugeridas de categorías por vertical

| Vertical | Categorías sugeridas |
|----------|---------------------|
| `retail` | Abarrotes, Bebidas, Lácteos, Panadería, Aseo, Cuidado personal, Congelados, Snacks |
| `bakery` | Insumos secos, Lácteos, Frescos, Saborizantes, Decoración, Empaques, Productos terminados |
| `hardware` | Tornillería, Herramientas, Pinturas, Eléctricos, Iluminación, Plomería, Jardinería, Seguridad |
| `pharmacy` | Analgésicos, Antibióticos, Antihistamínicos, Vitaminas, Higiene personal, Instrumentos, Dermatológicos, Cuidado infantil |
| `petshop` | Alimento perros, Alimento gatos, Accesorios, Higiene, Juguetes, Salud animal, Transporte, Acuarios |
| `other` | (vacío — usuario define) |

**Comportamiento en onboarding**:
- Al seleccionar una vertical, las categorías sugeridas se cargan en el select del formulario de producto.
- El usuario puede elegir una existente o agregar nueva (opción "Nueva categoría" en el select).
- Al agregar una nueva, se guarda en el array dinámico y aparece en todos los selects inmediatamente.

---

## Listas sugeridas de unidades por vertical

| Vertical | Unidades sugeridas |
|----------|-------------------|
| `retail` | Unidad, Kg, Litro, Paquete, Caja, Docena |
| `bakery` | Kg, g, Litro, ml, Unidad, Docena, Paquete |
| `hardware` | Unidad, Metro, Rollo, Caja, Litro, Juego, Par |
| `pharmacy` | Caja, Unidad, Frasco, Blíster, Ampolla, Tubo |
| `petshop` | Bolsa, Unidad, Kg, Lata, Frasco, Caja |
| `other` | (vacío — usuario define) |

---

## Monedas soportadas (MVP)

Lista en el onboarding:

| Código | Nombre | Uso típico |
|--------|--------|-----------|
| `COP` | Peso colombiano | Colombia (default) |
| `USD` | Dólar estadounidense | USA, multiregión |
| `MXN` | Peso mexicano | México |
| `EUR` | Euro | España |
| `PEN` | Sol peruano | Perú |
| `CLP` | Peso chileno | Chile |
| `ARS` | Peso argentino | Argentina |
| `BRL` | Real brasileño | Brasil |

---

## Zonas horarias soportadas (MVP)

| IANA | Ciudad/región |
|------|---------------|
| `America/Bogota` | Bogotá, Colombia (default) |
| `America/Mexico_City` | México |
| `America/Lima` | Perú |
| `America/Santiago` | Chile |
| `America/Buenos_Aires` | Argentina |
| `America/Sao_Paulo` | Brasil |
| `America/New_York` | USA Eastern |
| `Europe/Madrid` | España |

---

## Cómo agregar un nuevo vertical (v2+)

Cuando se añada un vertical adicional (ej: `restaurant`, `beauty`, `auto`), el desarrollo **debe**:

1. Agregar entrada al enum `vertical` en la BD.
2. Agregar entry en `VERTICALS` del frontend con código, icon, nombre y descripción.
3. Definir el catálogo semilla (8 productos típicos) en `defaultCategoriesFor(vertical)`.
4. Definir listas sugeridas en `defaultCategoriesListFor()` y `defaultUnitsListFor()`.
5. Si el vertical tiene reglas especiales (ej: farmacia necesita lote/vencimiento, restaurante necesita recetas), documentarlas en una sección específica y añadir los campos necesarios al modelo de datos.

---

## Generación de movimientos iniciales

Al finalizar el onboarding, por cada producto con `currentStock > 0` el sistema **debe** crear un movimiento automático:

```
type:       'in'
quantity:   currentStock
unitCost:   cost            // si el usuario ingresó costo en el onboarding
reason:     'Saldo inicial'
reference:  'INI-' + sku
createdAt:  now (UTC)
```

Esto asegura que el stock derivado coincide con lo que el usuario ingresó y mantiene trazabilidad desde el día 1.

---

## Datos demo precargados (modo "Demo")

Al primer uso (sin onboarding), el sistema ofrece una empresa de muestra:

**Empresa**: Tienda Demo Inventra · COP · Bogotá · vertical `retail`.

**Productos** (13): arroz, azúcar, aceite, leche, pan, gaseosa, jabón, atún, galletas, chocolatina, café, shampoo, olla arrocera.

**Movimientos** (~60 distribuidos en 30 días): compras con `unitCost` realista y ventas con `unitPrice` que varía (precio pleno, promo 90-98%, liquidación 80-85%) para demostrar los diferenciadores (WAC, margen real, ABC, detección de descuentos).

**Casos de uso cubiertos por el demo**:
- Producto estrella con rotación alta (arroz).
- Producto por agotarse pronto (pan, galletas).
- Producto con sobrestock (chocolatina).
- Producto sin movimiento — dead stock (olla arrocera).
- Cambios de precio de compra para demostrar WAC (arroz: 2.400 → 2.500; leche: 3.500 → 3.600).
- Descuentos y promociones en ventas.

El usuario puede **restaurar** el demo en cualquier momento desde Configuración, o **empezar una empresa nueva** (cierra el demo).
