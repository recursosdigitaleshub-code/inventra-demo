# 04 · Reglas de negocio y algoritmos

Este documento formaliza las reglas y fórmulas que el sistema **debe** implementar. Cada regla tiene un identificador (**RN-xxx**) para referencia cruzada. Donde aplica, se incluye la función equivalente del prototipo para verificación lado a lado.

---

## RN-ST · Stock

### RN-ST-001 · El stock es derivado, nunca almacenado

```
stock(p) = Σ qty(m) si m.type ∈ {in, adjust_pos}
         − Σ qty(m) si m.type ∈ {out, adjust_neg}
         para todo m ∈ movimientos(p)
```

- Nunca se escribe un campo `stock` en el producto.
- Toda la UI consulta `stock()` vía función / query, no vía atributo.
- Para rendimiento (ver RNF-PF-003), se **debería** mantener una tabla materializada actualizada por trigger.

### RN-ST-002 · Validación de stock no negativo

Al crear un movimiento:
1. Si `movement.type ∈ {out, adjust_neg}` y `settings.allowNegativeStock = false`:
2. Calcular `projected = stock(product) − quantity`.
3. Si `projected < 0`: rechazar con error.

Mensaje de error sugerido (español Colombia):
> "Stock insuficiente para «[nombre]». Disponible: [stock] [unit], solicitado: [qty] [unit]."

### RN-ST-003 · Movimientos inmutables

- No se **debe** poder editar ni eliminar un movimiento una vez registrado.
- Para "corregir" un error se registra un movimiento compensatorio (ajuste positivo o negativo) con motivo explicativo en `reason`.

---

## RN-VA · Valuación de inventario

### RN-VA-001 · Método por defecto: promedio ponderado (WAC)

Default: `settings.valuationMethod = 'avg'`. El costo unitario efectivo se calcula como:

```
WAC(p) = Σ(qty × unitCost) / Σ(qty)
         para toda entrada m del producto p con m.unitCost > 0
```

**Ejemplo numérico** (usado en el prototipo):
- Compra 1: 40 u a $2.400 = $96.000
- Compra 2: 30 u a $2.500 = $75.000
- Total: 70 u valorizadas en $171.000
- WAC = 171.000 / 70 = **$2.443 por unidad**

A partir de ese momento, todas las ventas y el valor del inventario se calculan con $2.443.

### RN-VA-002 · Método "Último costo"

Si `settings.valuationMethod = 'last'`:

```
costUnit(p) = m.unitCost
              donde m es el movimiento in más reciente
              (m.createdAt DESC) con unitCost > 0
```

Útil para cotizaciones rápidas. Menos preciso contablemente.

### RN-VA-003 · Método FIFO

Si `settings.valuationMethod = 'fifo'`:

**En el MVP**: se trata como WAC (RN-VA-001) por simplicidad.

**En v2**: se implementa FIFO real manteniendo lotes. Cada entrada crea un lote con su `unitCost`. Cada salida descarga lotes en orden cronológico, calculando el COGS por lote consumido.

### RN-VA-004 · Fallback cuando no hay costo registrado

Si `costUnit(p)` resulta 0 (no hay entradas con `unitCost > 0`):
- Se **debe** usar `product.cost` (costo de referencia inicial) como fallback.
- Si `product.cost = 0`, el producto se marca como "sin costo" y los reportes de rentabilidad lo excluyen de totales.

### Función equivalente del prototipo

```js
function costOf(p) {
  if (!p) return 0;
  const m = valuationMethod();
  const computed = m === 'last' ? lastInCost(p.id) : avgWAC(p.id);
  return computed > 0 ? computed : Number(p?.cost || 0);
}
```

---

## RN-PR · Precio de venta

### RN-PR-001 · Precio por movimiento (descuentos reales)

Cada salida tipo "Venta" **puede** registrar un `unitPrice` específico que refleje el precio real cobrado (descuento, promoción, ajuste).

### RN-PR-002 · Precio efectivo de un movimiento

```
unitPrice(m, p) = m.unitPrice      si m.unitPrice > 0
                = p.price          en caso contrario (fallback a lista)
```

### RN-PR-003 · Ingreso de un movimiento

```
revenue(m, p) = 0                              si m es entrada
              = m.quantity × unitPrice(m, p)   si m es salida
```

### RN-PR-004 · Precio promedio efectivo (para reportes de rentabilidad)

Para un producto en los últimos N días:

```
avgSalePrice(p, days) = Σ revenue(m, p) / Σ qty(m)
                        para toda salida m del producto p en los últimos days días
```

Si no hubo salidas: fallback a `p.price`.

### RN-PR-005 · Margen unitario

```
marginPct(p) = ((price(p) − cost(p)) / price(p)) × 100
```

Donde `cost(p)` usa el método de valoración vigente (RN-VA-001).

- Si `price = 0` o `cost = 0`: retorna 0 (no hay margen calculable).
- Si falta costo: la UI muestra badge "Falta costo" en lugar del margen.

### RN-PR-006 · Badge de margen (clasificación visual)

| Margen | Color |
|--------|-------|
| `≥ 30%` | Verde (`badge-ok`) |
| `15% ≤ m < 30%` | Azul (`badge-info`) |
| `0 < m < 15%` | Amarillo (`badge-warn`) |
| `m ≤ 0` | Gris (`badge-muted`) |
| sin costo | Gris (`badge-muted`) + texto "Falta costo" |

---

## RN-CO · Cobertura y consumo

### RN-CO-001 · Consumo diario promedio

```
avgDailyOut(p, days) = Σ qty(m) / days
                       para toda salida m del producto p en los últimos days días
```

Default: `days = 30`.

### RN-CO-002 · Días de cobertura

```
daysOfCoverage(p, days) = stock(p) / avgDailyOut(p, days)
                        = ∞ si avgDailyOut = 0
```

Interpretación en UI:

| Rango | Color | Etiqueta |
|-------|-------|---------|
| `∞` (sin consumo) | Gris | "Sin consumo reciente" |
| `< 3` | Rojo | Crítico, a agotarse |
| `3 ≤ d < 10` | Amarillo | A agotarse pronto |
| `10 ≤ d ≤ 90` | Verde | Cobertura saludable |
| `> 90` | Amarillo | Sobrestock |

---

## RN-FC · Pronóstico de reposición

### RN-FC-001 · Parámetros por defecto

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `leadDays` | 7 | Días que demora el proveedor en entregar. |
| `safetyDays` | 3 | Stock de seguridad ante imprevistos. |
| `targetDays` | 30 | Cobertura objetivo post-pedido. |

Estos defaults **pueden** configurarse por tenant en v1.1.

### RN-FC-002 · Algoritmo de sugerencia

Entrada: producto `p`, parámetros por defecto.
Salida: `{ qty, daysLeft, reorderByDate, urgent, avgDaily }` o `null` si no se recomienda pedir.

```
1. v = avgDailyOut(p, 30)
2. si v ≤ 0 → null (sin consumo, no se puede estimar)
3. stock = stockOf(p)
4. daysLeft = stock / v
5. si daysLeft > leadDays + safetyDays + 3 → null (cobertura suficiente)
6. qty = ceil(v × (targetDays + safetyDays) − stock)
7. si qty ≤ 0 → null
8. urgent = (daysLeft ≤ leadDays)
9. reorderByDate = now + (daysLeft − leadDays) días   // null si urgent
10. return { qty, daysLeft: floor(daysLeft), reorderByDate, urgent, avgDaily: v }
```

### RN-FC-003 · Prioridad en reporte

| daysLeft | Prioridad | Color |
|----------|-----------|-------|
| `≤ 3` | Urgente | Rojo (`badge-danger`) |
| `4 – 7` | Alta | Amarillo (`badge-warn`) |
| `> 7` | Media | Azul (`badge-info`) |

### RN-FC-004 · Manejo de "ya es tarde"

Si `urgent = true` (no hay tiempo para pedir y recibir a tiempo):
- La fecha de reorden se **debe** mostrar como "🚨 Pedir ya" en rojo, **no** como una fecha pasada.
- Esto fue un bug reportado que se corrigió: decir "Pedir antes del [día actual]" era ilógico.

---

## RN-AB · Clasificación ABC (Pareto)

### RN-AB-001 · Basada en ingresos reales

La clasificación ABC se calcula sobre **ingresos** (no sobre unidades ni sobre margen) de los últimos 30 días.

### RN-AB-002 · Algoritmo

```
1. Para cada producto p:
     out(p) = outQtySince(p, 30)
     val(p) = outRevenueSince(p, 30)   // usa unitPrice real
     cls(p) = 'Z'  // default

2. Filtrar productos con val > 0, ordenar descendente por val.
3. total = Σ val(p) de todos los productos activos.
4. cumulative = 0
5. Por cada producto en el orden:
     cumulative += val(p)
     pct = cumulative / total
     cls(p) = 'A' si pct ≤ 0.80
             'B' si pct ≤ 0.95
             'C' en caso contrario
6. Los productos con val = 0 conservan cls = 'Z' (sin actividad).
```

### RN-AB-003 · Presentación amigable

La UI **no** muestra las letras A/B/C/Z directamente. Usa labels con emoji:

| Clase interna | Emoji | Label | Hint |
|---------------|-------|-------|------|
| `A` | ⭐ | Estrellas | "Los que más te dan plata" |
| `B` | 💪 | Buenos | "Aportan bien al negocio" |
| `C` | 🔹 | Secundarios | "Aportan poco" |
| `Z` | 💤 | Sin actividad | "No se vendieron el último mes" |

---

## RN-IN · Insights automáticos

El motor de insights analiza el inventario y genera recomendaciones. Cada insight tiene nivel (`danger`, `warning`, `info`, `success`), icon, título, mensaje y lista de productos afectados.

### RN-IN-001 · Insight: Reposición urgente

**Condición**: productos donde `stockOf(p) = 0` y hubo ventas recientes, O `daysOfCoverage(p) < 3`.

**Salida**:
- Nivel: `danger`
- Icon: 🚨
- Título: `[N] producto(s) requieren reposición urgente`
- Mensaje: "Cobertura menor a 3 días o sin stock con ventas recientes."

### RN-IN-002 · Insight: Por agotarse

**Condición**: `3 ≤ daysOfCoverage(p) < 10` y stock > 0.

**Salida**:
- Nivel: `warning`
- Icon: ⏰
- Título: `[N] producto(s) se están agotando`
- Mensaje: "Entre 3 y 10 días de cobertura. Planifica la compra pronto."

### RN-IN-003 · Insight: Sobrestock

**Condición**: `daysOfCoverage(p) > 90` y stock > 0 y tuvo al menos 1 venta en los últimos 30 días.

**Salida**:
- Nivel: `warning`
- Icon: 📦
- Título: `[N] producto(s) con sobrestock`
- Mensaje: "Más de 90 días de cobertura. Considera promociones o detener compras."

### RN-IN-004 · Insight: Sin movimiento (dead stock)

**Condición**: `daysSinceLastMovement(p) ≥ 30` y `stockOf(p) > 0`.

**Salida**:
- Nivel: `warning`
- Icon: 💤
- Título: `[N] producto(s) sin movimiento hace 30+ días`
- Mensaje: "Candidatos a liquidar o descatalogar — ocupan capital."

### RN-IN-005 · Insight: Best-seller con margen bajo

**Condición**: `0 < marginPct(p) < 10` y clase ABC ∈ {A, B}.

**Salida**:
- Nivel: `info`
- Icon: 💰
- Título: `[N] producto(s) muy vendidos con margen bajo`
- Mensaje: "Oportunidad para negociar costo o subir precio."

### RN-IN-006 · Insight: Estrellas

**Condición**: `marginPct(p) > 30` y clase ABC = A.

**Salida**:
- Nivel: `success`
- Icon: ⭐
- Título: `[N] producto(s) estrella del negocio`
- Mensaje: "Alta rotación y margen superior al 30%. Mantenlos siempre surtidos."

### RN-IN-007 · Fallback: todo bajo control

Si ningún insight aplica:
- Nivel: `success`
- Icon: ✅
- Título: "Todo bajo control"
- Mensaje: "No detectamos problemas críticos en el inventario."

---

## RN-HS · Health score (salud del inventario)

### RN-HS-001 · Componentes del score

Cada componente es un porcentaje de 0 a 100.

| Componente | Cálculo | Peso |
|------------|---------|------|
| `stock` | % de productos con `stock ≥ minStock` | 35% |
| `rotation` | % de productos con al menos 1 movimiento en los últimos 30 días | 25% |
| `dead` | Inverso de dead stock: % de productos con movimiento en los últimos 30 días | 20% |
| `margin` | Promedio de `marginPct(p)` de productos con margen > 0, normalizado: 40% de margen = 100 puntos | 20% |

### RN-HS-002 · Score final

```
score = round(0.35 × stock + 0.25 × rotation + 0.20 × dead + 0.20 × margin)
```

Rango: 0 a 100.

### RN-HS-003 · Etiquetado

| Score | Label | Color |
|-------|-------|-------|
| `≥ 85` | Excelente | Verde |
| `70 – 84` | Bueno | Verde |
| `50 – 69` | Regular | Amarillo |
| `< 50` | Crítico | Rojo |

### RN-HS-004 · Presentación simplificada (decisión UX)

El prototipo ocultó el score numérico detallado (35/25/20/20) para usuarios no técnicos. En su lugar:
- En el dashboard se muestra un semáforo visual basado en **alertas + reposiciones urgentes** (mood), no directamente en el score.
- El score numérico **puede** mostrarse en una sección avanzada o tooltip, pero no es el elemento principal.

Lógica del mood:

```
total = alertCount + reorderCnt

si total = 0         → 🟢 "Todo bajo control"
si total ∈ [1, 3]    → 🟡 "Algunos puntos de atención"
si total > 3         → 🔴 "Requiere tu atención hoy"
```

---

## RN-CH · Chat NLP — reglas de detección

### RN-CH-001 · Pipeline

```
1. Normalizar input (lowercase, remover tildes).
2. Buscar intención por regex (orden de precedencia abajo).
3. Si aplica, buscar producto mencionado con chatFindProduct().
4. Ejecutar la respuesta correspondiente.
5. Si ninguna intención aplica: fallback genérico con sugerencias.
```

### RN-CH-002 · Orden de precedencia de intenciones

La primera regex que coincida gana. El orden en el código del prototipo es:

1. Saludo: `/(hola|buen[oa]s|hey|hi\b)/`
2. Ayuda: `/(ayuda|help|qu[eé] pod[eé]s)/`
3. Reposición: `/(repon|pedir|compr|cu[aá]ndo.*ped|pron[oó]stic|reabastec|sugier)/`
4. Alertas: `/(alert|bajo|m[ií]nim|urge)/`
5. Dead stock: `/(muert|sin movimiento|no se mueve|no vend)/`
6. Top: `/(top|m[aá]s (vend|salid)|ranking|estrell)/`
7. Valor: `/(valor|cu[aá]nto (plata|dinero)|capital|parad)/`
8. Margen: `/(margen|rentabil|utilidad|ganan)/`
9. Ventas: `/(vend|venta|sali|sacado)/`
10. Compras: `/(compr|entrada|ingres|recibi)/`
11. Cobertura: `/(cobertura|d[ií]as? resta|hasta cu[aá]ndo|aguant)/`
12. Stock: `/(stock|cu[aá]nto tengo|hay de|qued[ao]n)/`
13. Salud: `/(salud|score|estado general|c[oó]mo (va|estoy|est[aá])n?)/`
14. ABC: `/(abc|clasific)/`
15. Fallback.

### RN-CH-003 · Ventana temporal dinámica

En intenciones que consultan un período:
- Si el texto contiene "hoy" → `days = 1`.
- Si contiene "semana" → `days = 7`.
- Default → `days = 30`.

### RN-CH-004 · Búsqueda de producto en texto

`chatFindProduct(text)`:
1. Para cada producto del catálogo, tokenizar `name` y `sku`.
2. Buscar coincidencia case-insensitive por palabras de longitud > 3 en el texto.
3. Retornar el primer match (ordenado por match más específico primero).
4. Si no hay match: null.

### RN-CH-005 · Tono y estilo

- Respuestas cortas, directas, con bullets donde ayuda.
- Emojis funcionales para categorizar (📊 📤 📥 🔔 ⏳ 💰).
- **Sin voseo argentino**. Usar formas colombianas: "prueba", "pregunta", "ingresa", "dime", "pídeme".
- Formato de dinero según moneda del tenant.

---

## RN-OB · Onboarding

### RN-OB-001 · Generación de movimientos iniciales

Al finalizar el onboarding, por cada producto con `currentStock > 0`:

```
movimiento = {
  type: 'in',
  quantity: currentStock,
  unitCost: cost,          // si el usuario lo ingresó
  reason: 'Saldo inicial',
  reference: 'INI-' + sku,
  createdAt: now
}
```

### RN-OB-002 · Configuración por vertical

Al seleccionar una vertical (no `other`), el sistema pre-carga:
- 8 productos típicos con SKU, nombre, categoría, unidad, minStock, cost, price, currentStock.
- Lista de categorías sugeridas.
- Lista de unidades sugeridas.
- Patrón de SKU (ej: `PRO-001`, `INS-001`, `HWR-001`, `MED-001`, `PET-001`).

Ver documento 06 — Verticales y seed para el detalle.

### RN-OB-003 · Vertical "Otro"

- No se pre-carga catálogo.
- Listas de categorías y unidades vacías.
- El usuario agrega todo manualmente.
- Requiere `customVerticalName` (descripción corta del negocio).

---

## RN-RP · Reportes — reglas de cálculo

### RN-RP-001 · Filtros globales

Todos los tabs de reportes aceptan filtros globales:
- `from` (fecha desde, ISO date).
- `to` (fecha hasta, ISO date).
- `productId` (opcional, filtra un producto).
- `category` (opcional).
- `movementType` (opcional: `in`, `out`, o ambos).

### RN-RP-002 · Reporte de rentabilidad — detalle

Para cada producto:
```
qty     = Σ m.quantity      // movimientos out en rango
revenue = Σ revenue(m, p)   // usa unitPrice real
cogs    = qty × costOf(p)   // solo si hasCost(p)
profit  = revenue − cogs
margin% = (profit / revenue) × 100   // si revenue > 0
avgPrice = revenue / qty
```

### RN-RP-003 · Indicador de desvío de precio

En reporte de rentabilidad:
- Calcular `diff = ((avgPrice − listPrice) / listPrice) × 100`.
- Si `|diff| ≥ 0.5%`: mostrar indicador visual.
  - Verde si `diff > 0` (se vendió más caro que lista).
  - Amarillo si `diff < 0` (se vendió más barato — descuento/promo).

### RN-RP-004 · Totales de rentabilidad

Los totales del header (Ingresos, COGS, Utilidad, Margen bruto) **solo** suman productos con costo definido. Los productos sin costo se listan en la tabla pero no se incluyen en totales (para no inflar la utilidad).

Si hay productos sin costo en el rango: mostrar alerta indicando cuántos y recomendando cargar costo.

---

## Apéndice: tabla de funciones del prototipo

Mapeo entre reglas de negocio y funciones JavaScript del prototipo, para facilitar verificación y testing.

| Regla | Función prototipo | Ubicación aprox. |
|-------|-------------------|------------------|
| RN-ST-001 | `stockOf(productId)` | prototype.html |
| RN-ST-002 | `registerMovement()` | ~línea 438 |
| RN-VA-001 | `avgWAC(productId)` | ~1441 |
| RN-VA-002 | `lastInCost(productId)` | ~1448 |
| RN-VA-004 | `costOf(p)` | ~1460 |
| RN-PR-002 | `movementUnitPrice(m, p)` | ~1499 |
| RN-PR-003 | `movementRevenue(m, p)` | ~1505 |
| RN-PR-004 | `avgSalePrice(pid, days)` | ~1514 |
| RN-PR-005 | `marginPct(p)` | ~1467 |
| RN-PR-006 | `marginBadge(p)` | ~1472 |
| RN-CO-001 | `avgDailyOut(pid, days)` | ~1488 |
| RN-CO-002 | `daysOfCoverage(pid, days)` | ~1491 |
| RN-FC-002 | `suggestReorder(p, ...)` | ~1526 |
| RN-AB-002 | `abcClassification(days)` | ~1506 |
| RN-IN-* | `computeInsights()` | ~1540 |
| RN-HS-001/002 | `healthScore()` | (buscar en archivo) |
| RN-HS-003 | `scoreLabel(s)` | ~1653 |
| RN-CH-* | `chatReply(input)` | ~1860 |
