# 01 · Requisitos funcionales

Cada módulo lista sus requisitos (**RF-xxx**) con criterios de aceptación. La numeración es estable para referencia cruzada en tickets.

---

## RF-OB · Onboarding

**RF-OB-001** · El sistema **debe** ofrecer un wizard de creación inicial (single-page) para registrar la primera empresa, el usuario administrador y el catálogo inicial.

**RF-OB-002** · El wizard **debe** pedir los siguientes datos de empresa: nombre, NIT/RUC/Tax ID, email de contacto (opcional), teléfono (opcional), moneda, zona horaria.

**RF-OB-003** · El wizard **debe** ofrecer 6 verticales predefinidas (tienda, panadería, ferretería, farmacia, petshop, otro) como selección visual (cards).

**RF-OB-004** · Al seleccionar una vertical, el sistema **debe** pre-cargar automáticamente:
- Un catálogo semilla de productos (8 productos típicos con SKU, nombre, categoría, unidad, mínimo, costo, precio).
- Una lista de categorías sugeridas para esa vertical.
- Una lista de unidades sugeridas para esa vertical.

**RF-OB-005** · Para la vertical "Otro", el sistema **debe** permitir al usuario escribir una descripción personalizada del negocio y empezar con catálogo vacío.

**RF-OB-006** · El wizard **debe** permitir editar, eliminar o agregar productos al catálogo pre-cargado antes de finalizar.

**RF-OB-007** · El wizard **debe** permitir crear nuevas categorías y unidades on-the-fly durante la carga del catálogo.

**RF-OB-008** · El wizard **debe** pedir datos del usuario administrador: nombre, email, contraseña (mínimo 6 caracteres).

**RF-OB-009** · El wizard **debe** pedir datos de la sucursal principal: nombre, dirección, nombre de bodega.

**RF-OB-010** · El wizard **debe** permitir configurar: método de valorización (WAC/FIFO/Último costo), permitir stock negativo (sí/no), umbral de aprobación de ajustes.

**RF-OB-011** · Al finalizar, el sistema **debe** generar un movimiento de "Saldo inicial" por cada producto con stock > 0.

**RF-OB-012** · El sistema **debe** ofrecer un modo "Demo" pre-cargado (empresa de muestra con 13 productos y 30 días de movimientos) para permitir exploración sin onboarding.

**RF-OB-013** · El sistema **debe** ofrecer un botón "Restaurar demo" y "Empresa nueva" para alternar entre el demo y una sesión limpia.

**Criterios de aceptación**:
- Un usuario sin experiencia previa puede completar el onboarding en menos de 20 minutos con 50 productos.
- Tras finalizar, el dashboard muestra datos coherentes (valor inventario, alertas, etc.).

---

## RF-PR · Productos (catálogo)

**RF-PR-001** · El sistema **debe** permitir crear, editar y eliminar productos.

**RF-PR-002** · Cada producto **debe** tener: SKU, nombre, categoría, unidad, stock mínimo, costo de referencia, precio de venta. Todos son obligatorios excepto costo (opcional pero fuertemente recomendado).

**RF-PR-003** · El SKU **debe** ser único por tenant, con comparación case-insensitive.

**RF-PR-004** · El sistema **debe** mostrar una tabla de productos con: SKU, nombre, categoría, unidad, stock actual, stock mínimo, costo promedio (WAC calculado), precio, badge de margen, estado.

**RF-PR-005** · La tabla **debe** permitir filtrar por:
- Búsqueda libre (nombre, SKU, categoría).
- Categoría (select).
- Estado de stock (todo, bajo mínimo, sobre mínimo, sin stock).

**RF-PR-006** · El sistema **no debe** permitir eliminar un producto que tenga movimientos registrados. En su lugar, **debe** ofrecer marcarlo como inactivo (desactivado).

**RF-PR-007** · Al crear un producto con stock inicial > 0, el sistema **debe** generar automáticamente un movimiento de entrada tipo "Stock inicial".

**RF-PR-008** · El formulario de edición **debe** mostrar el stock actual (no editable) y el costo promedio actual (calculado en vivo, no editable).

**RF-PR-009** · El formulario de edición **debe** ofrecer una sección rápida "Agregar stock" que cree un movimiento de entrada desde el mismo formulario.

**RF-PR-010** · El badge de margen **debe** colorearse según:
- Verde: margen ≥ 30%.
- Azul: margen 15–30%.
- Amarillo: margen 0–15%.
- Gris: margen ≤ 0 o sin costo definido.
- Si no hay costo: badge "Falta costo".

---

## RF-MV · Movimientos (stock in / out / ajustes)

**RF-MV-001** · El sistema **debe** soportar 4 tipos de movimiento:
- `in`: entrada (compra, devolución cliente, producción).
- `out`: salida (venta, consumo interno, merma, devolución a proveedor).
- `adjust_pos`: ajuste positivo (conteo muestra más de lo registrado).
- `adjust_neg`: ajuste negativo (conteo muestra menos).

**RF-MV-002** · Todo movimiento **debe** tener: producto, tipo, cantidad (>0), motivo, fecha. Campos opcionales: unitCost (solo entradas), unitPrice (solo salidas tipo Venta), referencia.

**RF-MV-003** · El sistema **no debe** permitir crear un movimiento con cantidad ≤ 0.

**RF-MV-004** · El sistema **no debe** permitir una salida que deje stock negativo, salvo que `settings.allowNegativeStock = true`.

**RF-MV-005** · Los movimientos **deben** ser inmutables: no se pueden editar ni eliminar. Para corregir un error, se registra un movimiento inverso (ajuste).

**RF-MV-006** · En el formulario de entrada, el sistema **debe** permitir ingresar el costo unitario de esa compra específica. Si el proveedor cambió precios, este campo actualiza el WAC automáticamente.

**RF-MV-007** · El formulario de entrada **debe** mostrar en vivo:
- Stock actual del producto.
- Costo promedio actual (según método de valoración).
- Pre-llenar el costo unitario sugerido con el costo actual.

**RF-MV-008** · En el formulario de salida, cuando el motivo es "Venta", el sistema **debe** mostrar un campo opcional "Precio de venta unitario". Si el usuario no lo ingresa (queda en 0), se usa el precio de lista del producto.

**RF-MV-009** · El campo "Precio de venta unitario" **debe** ocultarse cuando el motivo no es "Venta" (Consumo interno, Merma, etc.).

**RF-MV-010** · El formulario de salida **debe** validar en tiempo real que la cantidad no exceda el stock disponible. Si lo excede, **debe** desactivar el botón de submit y mostrar el error.

**RF-MV-011** · El formulario de salida **debe** mostrar en vivo: stock disponible, stock mínimo, precio de lista.

**RF-MV-012** · El sistema **debe** tener una vista "Movimientos" con historial completo filtrable por:
- Producto.
- Tipo (entradas, salidas, ajustes).
- Rango de fechas.

**RF-MV-013** · La vista de movimientos **debe** mostrar por cada línea: fecha, producto, tipo (badge), cantidad (con signo y color), saldo acumulado del producto, motivo, referencia.

**RF-MV-014** · Los motivos predefinidos **deben** ser:
- Entrada: Compra, Devolución de cliente, Producción, Ajuste por conteo, Otro.
- Salida: Venta, Consumo interno, Merma / daño, Devolución a proveedor, Ajuste por conteo (−), Otro.

---

## RF-DS · Dashboard

**RF-DS-001** · El dashboard **debe** mostrar como primera impresión un semáforo de salud del inventario (score 0–100) con color (verde/amarillo/rojo) y etiqueta (Excelente/Bueno/Regular/Crítico).

**RF-DS-002** · El dashboard **debe** mostrar stat cards con:
- Total de unidades en stock.
- Valor total del inventario (a precio de venta).
- Cantidad de productos en alerta.

**RF-DS-003** · El dashboard **debe** mostrar accesos directos a "Nueva entrada" y "Nueva salida".

**RF-DS-004** · El dashboard **debe** listar los productos con stock bajo mínimo (máximo 10, ordenados por urgencia).

**RF-DS-005** · El dashboard **debe** listar los 10 últimos movimientos registrados.

**RF-DS-006** · El dashboard **debe** mostrar hasta 3 recomendaciones automáticas (insights) cuando existan problemas críticos.

**RF-DS-007** · El semáforo de salud **debe** ser clickeable y navegar a la vista Inteligencia.

---

## RF-AL · Alertas

**RF-AL-001** · El sistema **debe** tener una vista "Alertas" que liste todos los productos con stock < stock mínimo.

**RF-AL-002** · La lista **debe** ordenarse por urgencia: los más bajos primero (mayor % por debajo del mínimo).

**RF-AL-003** · Por cada producto alertado, **debe** mostrar: SKU, nombre, stock actual, stock mínimo, faltante, días de cobertura restantes.

**RF-AL-004** · La navegación lateral **debe** mostrar un badge numérico con la cantidad de alertas activas.

---

## RF-RP · Reportes

El módulo de reportes **debe** tener 6 tabs, cada uno con su filtro global (rango de fechas, producto, categoría, tipo movimiento) y su exportación a CSV.

### RF-RP-01 · Tab "Inventario actual"

**RF-RP-01-a** · **Debe** mostrar columnas: SKU, Producto, Categoría, Unidad, Stock, Mínimo, Entradas (en rango), Salidas (en rango), Costo promedio, Precio, Margen, Valor, Estado.

**RF-RP-01-b** · El valor **debe** calcularse como `stock × precio de lista`.

**RF-RP-01-c** · El estado **debe** ser "Bajo mínimo" (rojo) o "OK" (verde).

### RF-RP-02 · Tab "Movimientos"

**RF-RP-02-a** · **Debe** mostrar columnas: Fecha, Producto (nombre + SKU), Tipo (badge), Cantidad (con signo y color), Precio/Costo unitario, Total, Motivo, Referencia.

**RF-RP-02-b** · Si el movimiento tiene `unitCost` (entrada) o `unitPrice` (salida) registrado, **debe** mostrarlo en color normal.

**RF-RP-02-c** · Si no tiene valor específico, **debe** mostrar el precio/costo del catálogo en gris (indicando que es un respaldo).

**RF-RP-02-d** · Al pie del reporte **debe** aparecer una nota explicando qué significa el valor en gris.

### RF-RP-03 · Tab "Por categoría"

**RF-RP-03-a** · **Debe** agrupar por categoría y mostrar: Categoría, número de productos, unidades en stock totales, entradas, salidas, valor total.

**RF-RP-03-b** · Ordenado por valor total descendente.

### RF-RP-04 · Tab "Top productos"

**RF-RP-04-a** · **Debe** listar los 20 productos más movidos en el período, ordenados por total de movimientos (entradas + salidas).

**RF-RP-04-b** · Cada fila **debe** incluir una barra visual proporcional al producto más movido.

### RF-RP-05 · Tab "Rentabilidad"

**RF-RP-05-a** · **Debe** mostrar por producto: unidades vendidas, precio promedio real, ingresos, COGS, utilidad, margen %.

**RF-RP-05-b** · El precio promedio **debe** calcularse como `ingresos / unidades` (usando `unitPrice` real de cada movimiento).

**RF-RP-05-c** · Junto al precio promedio, **debe** mostrar un indicador visual (±%) comparado con el precio de lista, sólo si la diferencia es ≥ 0.5%.

**RF-RP-05-d** · El COGS **debe** calcularse como `qty × costo efectivo` (según método de valoración).

**RF-RP-05-e** · Los productos sin costo definido **deben** aparecer con utilidad y margen en "—" y marcados visualmente.

**RF-RP-05-f** · El header del reporte **debe** mostrar stat cards con: Ingresos totales, COGS, Utilidad bruta, Margen bruto %. Estos totales **deben** incluir solo productos con costo definido.

**RF-RP-05-g** · **Debe** incluir una sección expandible explicando:
- Cómo se calculan los ingresos cuando el precio de venta varía.
- Cómo se calcula el costo cuando los precios de compra cambian (WAC, FIFO, último costo con ejemplos numéricos).

### RF-RP-06 · Tab "Pronóstico"

**RF-RP-06-a** · **Debe** listar solo los productos que requieren reposición (resultado de `suggestReorder()` no nulo).

**RF-RP-06-b** · Columnas: Producto, Stock actual, Consumo diario (promedio 30d), Cobertura (días restantes), Cantidad sugerida, Fecha límite para pedir, Prioridad.

**RF-RP-06-c** · La prioridad **debe** asignarse:
- Urgente (rojo): ≤ 3 días restantes.
- Alta (naranja): 4–7 días.
- Media (azul): 7+ días.

**RF-RP-06-d** · Si ya no hay tiempo de pedir a tiempo (daysLeft ≤ leadTime), en vez de mostrar la fecha, **debe** mostrar "🚨 Pedir ya" en rojo.

**RF-RP-06-e** · Los productos sin movimiento (avgDailyOut = 0) **no deben** aparecer en esta tabla.

### Exportación CSV

**RF-RP-EX-001** · Cada tab **debe** exportar a CSV con las columnas mostradas en pantalla.

**RF-RP-EX-002** · El formato CSV **debe** usar `;` como separador (compatible con Excel en locales hispanohablantes) y codificación UTF-8 con BOM.

**RF-RP-EX-003** · El nombre del archivo **debe** ser `inventra-<tab>.csv` (ej. `inventra-rentabilidad.csv`).

**RF-RP-EX-004** · Las fechas en CSV **deben** ser ISO 8601. Los montos **deben** ser números sin separador de miles.

---

## RF-IN · Inteligencia del inventario

**RF-IN-001** · El sistema **debe** tener una vista "Inteligencia" accesible desde la navegación principal.

**RF-IN-002** · La vista **debe** mostrar en la parte superior un "mood general" del negocio basado en el total de alertas + reposiciones urgentes:
- 🟢 "Todo bajo control" si no hay alertas ni reposiciones.
- 🟡 "Algunos puntos de atención" si hay ≤ 3.
- 🔴 "Requiere tu atención hoy" si hay > 3.

**RF-IN-003** · **Debe** mostrar 4 tarjetas-resumen interactivas (clickeables con hover effect):
1. **💰 Vendido esta semana**: monto, unidades, top 3 productos con su aporte en pesos. Clic → Reportes > Top productos.
2. **🔔 En alerta**: cantidad, top 3 productos con su stock actual vs mínimo. Clic → Alertas.
3. **🔮 Por reponer pronto**: cantidad, top 3 con días restantes. Clic → scroll a "Pronóstico de reposición".
4. **💤 Sin movimiento**: cantidad, top 3 con días sin actividad. Clic → Productos (filtrado a inactivos).

**RF-IN-004** · Cada tarjeta **debe** mostrar texto de ayuda cuando la lista esté vacía (ej: "Sin ventas registradas esta semana").

**RF-IN-005** · **Debe** mostrar una sección "Clasificación de productos" con 4 cards:
- ⭐ Estrellas (clase A Pareto)
- 💪 Buenos (clase B)
- 🔹 Secundarios (clase C)
- 💤 Sin actividad (clase Z)

**RF-IN-006** · Cada card de clasificación **debe** mostrar el emoji, la cantidad de productos, el label amigable y un hint corto explicando qué significa.

**RF-IN-007** · **Debe** incluir una sección expandible "¿Cómo se clasifican los productos?" explicando la regla 80/20 de Pareto en lenguaje simple.

**RF-IN-008** · **Debe** mostrar una sección "Recomendaciones automáticas" con insights generados por el motor (ver RN-IN en documento 04):
- Urgentes (stock crítico o agotado).
- Por agotarse (cobertura 3–10 días).
- Sobrestock (cobertura > 90 días).
- Sin movimiento (30+ días).
- Estrellas a mantener surtidas.
- Best-sellers con margen bajo.

**RF-IN-009** · **Debe** mostrar una tabla "Pronóstico de reposición" con los productos que requieren reposición, con id `forecast-section` (para scroll anchors).

**RF-IN-010** · La tabla de pronóstico **debe** incluir una sección expandible explicando los supuestos: lead time 7 días, stock de seguridad 3 días, cobertura objetivo 30 días.

---

## RF-CH · Chat en lenguaje natural

**RF-CH-001** · El sistema **debe** tener un asistente de chat accesible desde un botón flotante (FAB) en la esquina inferior derecha, presente en todas las vistas principales.

**RF-CH-002** · Al abrirse, el chat **debe** mostrar un saludo inicial y un panel de chips sugeridos con preguntas comunes.

**RF-CH-003** · El chat **debe** detectar al menos las siguientes intenciones:
1. Saludo.
2. Ayuda / capacidades.
3. "¿Qué debo reponer?" / reposición.
4. Alertas / stock bajo.
5. Productos muertos / sin movimiento.
6. Top productos / más vendidos.
7. Valor del inventario.
8. Margen / rentabilidad (general o por producto).
9. Ventas del período.
10. Compras del período.
11. Cobertura en días.
12. Stock actual (general o por producto).
13. Salud del inventario.
14. Clasificación ABC.

**RF-CH-004** · El chat **debe** detectar productos mencionados en el texto por nombre o SKU y dar respuestas específicas al producto encontrado.

**RF-CH-005** · El chat **debe** soportar modificadores de ventana temporal:
- "hoy" → 1 día.
- "semana" → 7 días.
- Default → 30 días.

**RF-CH-006** · Si no entiende el input, **debe** sugerir ejemplos de preguntas válidas, no mostrar error.

**RF-CH-007** · Todas las respuestas **deben** ser en español Colombia, sin voseo argentino ni formalismo excesivo.

**RF-CH-008** · El chat **debe** ser cerrable y reabrible conservando el historial de la sesión.

---

## RF-CF · Configuración

**RF-CF-001** · El sistema **debe** permitir al administrador cambiar:
- Moneda.
- Método de valoración (WAC, FIFO, último costo).
- Permitir stock negativo (sí/no).
- Stock mínimo por defecto.
- Umbral de aprobación de ajustes.
- Zona horaria.

**RF-CF-002** · Cambiar el método de valoración **debe** recalcular `costOf()` dinámicamente en la próxima renderización (no requiere migración de datos históricos).

**RF-CF-003** · El sistema **debe** permitir exportar todos los datos de la empresa (productos, movimientos, settings) en un backup JSON.

**RF-CF-004** · El sistema **debe** permitir resetear la empresa demo y cargar una sesión nueva (con confirmación).

---

## Prioridades

| Prioridad | Módulos |
|-----------|---------|
| **P0 — Crítico** | Onboarding, Productos, Movimientos, Dashboard, Alertas |
| **P1 — Alto** | Reportes (Inventario, Movimientos, Rentabilidad), Inteligencia (ABC + recomendaciones), Pronóstico |
| **P2 — Medio** | Chat NLP, Reportes (Por categoría, Top productos), Configuración avanzada |
| **P3 — Nice to have** | Backup/restore JSON, exportación masiva |
