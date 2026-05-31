# 10 · Glosario

Términos del dominio usados en el producto y en esta documentación. El objetivo es que los equipos de producto, desarrollo y soporte hablen el mismo idioma.

---

### ABC (clasificación)
Método de clasificación de productos según su contribución a los ingresos, basado en la regla 80/20 de Pareto. En Inventra se presenta con labels amigables: **⭐ Estrellas** (A, 80% inicial), **💪 Buenos** (B, 80–95%), **🔹 Secundarios** (C, 95–100%), **💤 Sin actividad** (Z, 0 ventas). Ver RN-AB.

### Ajuste (positivo / negativo)
Movimiento de inventario generado a partir de un conteo físico, cuando la cantidad observada difiere del stock registrado. `adjust_pos` suma al stock; `adjust_neg` resta. Reemplaza a editar un movimiento anterior (los movimientos son inmutables).

### Alerta
Producto cuyo stock actual es menor que su stock mínimo configurado. Aparece en la vista Alertas, en el badge del sidebar y en el dashboard.

### Backup
Exportación completa de los datos del tenant (productos, movimientos, settings) en formato JSON. Permite migrar o archivar.

### Badge
Etiqueta visual inline que indica un estado (OK, bajo mínimo, urgente, sin costo). Colores semánticos definidos en el documento 09.

### Categoría
Clasificación libre del producto dentro del catálogo ("Abarrotes", "Aseo", "Herramientas"). Cada vertical trae una lista sugerida al onboarding; el usuario puede agregar nuevas.

### Cobertura (días de cobertura)
Cuántos días durará el stock actual al ritmo de consumo promedio del último mes. Fórmula: `stock / consumo diario promedio`. Infinito si no hay consumo.

### COGS (Cost Of Goods Sold)
Costo de la mercancía vendida. En un período: `Σ(cantidad × costo efectivo)` de cada venta. Aparece en el reporte de rentabilidad.

### Consumo diario promedio
Unidades de un producto que salen por día, promediadas en los últimos N días (default 30). Base para el pronóstico.

### Costo de referencia
Costo inicial ingresado al crear un producto (`product.cost`). Se usa como fallback cuando no hay entradas registradas con `unitCost`. Una vez hay compras, el costo efectivo se calcula dinámicamente.

### Costo efectivo
Costo unitario calculado según el método de valoración (WAC, FIFO, último costo) vigente. Función `costOf(p)`. Se recalcula a demanda, nunca se almacena.

### Dashboard
Vista principal (/) con semáforo de salud, stat cards, alertas y últimos movimientos.

### Dead stock
Productos con stock > 0 pero sin movimiento hace 30 días o más. Candidatos a liquidar o descatalogar.

### Demo
Empresa de muestra pre-cargada con 13 productos y 60 movimientos distribuidos en 30 días. Permite explorar el sistema sin hacer onboarding.

### Entrada (movement.type = 'in')
Ingreso de stock al inventario. Motivos típicos: Compra, Devolución de cliente, Producción, Saldo inicial.

### FAB (Floating Action Button)
Botón flotante en la esquina inferior derecha. En Inventra es el acceso al chat (💬).

### FIFO (First In, First Out)
Método de valoración donde el costo de cada salida se calcula con el costo de las entradas más antiguas que todavía tienen stock. En el MVP se trata como WAC; en v2 se implementa real.

### Filtro global (reportes)
Conjunto de filtros (desde, hasta, producto, categoría, tipo movimiento) que se aplican a todos los tabs del módulo de reportes.

### Forecast / Pronóstico
Cálculo automático de cuándo pedir y cuánto, por producto. Considera consumo diario, stock actual, lead time, stock de seguridad y cobertura objetivo. Ver RN-FC.

### Health score
Puntaje 0–100 que resume el estado del inventario basado en cuatro componentes: % productos con stock, % con rotación, % sin dead stock, y margen promedio. En la UI simplificada se presenta como un semáforo (🟢/🟡/🔴) basado en alertas + reposiciones.

### Insight
Recomendación automática generada por el motor de análisis. Categorías: urgente, por agotarse, sobrestock, sin movimiento, best-seller con margen bajo, estrellas. Ver RN-IN.

### Inteligencia (vista)
Pantalla dedicada con semáforo general, tarjetas resumen, clasificación ABC, recomendaciones y pronóstico. Es donde "se piensa el negocio".

### Lead time
Tiempo que demora un proveedor en entregar un pedido. Default en Inventra: 7 días. Se usa en el pronóstico de reposición.

### Margen (margin pct)
Porcentaje de ganancia sobre el precio de venta: `((precio − costo) / precio) × 100`. Se calcula con el costo efectivo. Si no hay costo: la UI muestra "Falta costo".

### Mínimo / stock mínimo
Nivel por debajo del cual un producto se considera en alerta. Se configura por producto; el default del tenant aplica a productos nuevos.

### Motivo (reason)
Razón por la cual se registra un movimiento. Predefinidos para entradas (Compra, Producción...) y salidas (Venta, Consumo interno, Merma...).

### Movimiento (movement)
Transacción de inventario. Inmutable una vez creada. La suma algebraica de todos los movimientos de un producto es su stock actual.

### Multi-tenant
Arquitectura donde múltiples empresas (tenants) comparten la misma instalación del software, con datos aislados lógicamente. Cada tenant ve solo sus propios datos.

### Onboarding
Flujo inicial de registro de una empresa: datos empresa, vertical, usuario admin, sucursal, catálogo inicial. Culmina creando el tenant.

### Pareto (principio)
Observación empírica de que ~80% de los resultados vienen de ~20% de las causas. En inventario: el 80% de los ingresos viene típicamente del 20% de los productos. Base de la clasificación ABC.

### Promedio ponderado (WAC — Weighted Average Cost)
Método de valoración donde el costo unitario es el promedio de todas las compras ponderado por cantidad: `Σ(qty × unitCost) / Σ(qty)`. Método default en Colombia. Ver RN-VA-001.

### Pronóstico de reposición
Ver Forecast.

### Referencia
Campo opcional de los movimientos para trazabilidad externa (número de factura, venta, orden de compra). Ejemplo: "FAC-1011", "VTA-0032".

### Reporte
Vista con datos agregados o detallados, usualmente exportable a CSV. Inventra tiene 6 tabs de reportes. Ver documento 05.

### Rotación
Frecuencia con que un producto se mueve. En Inventra se aproxima con "tuvo al menos un movimiento en los últimos 30 días" para el health score.

### Salida (movement.type = 'out')
Egreso de stock del inventario. Motivos: Venta, Consumo interno, Merma/daño, Devolución a proveedor.

### Saldo acumulado (running balance)
Stock del producto justo después de un movimiento específico. Se muestra en la tabla de historial de movimientos para auditoría.

### Saldo inicial
Motivo especial usado al onboarding o al crear un producto con `currentStock > 0`. Se genera un movimiento `in` con `reason = 'Saldo inicial'`.

### Semáforo
Indicador visual de 3 estados (🟢 bueno, 🟡 atención, 🔴 crítico) usado para el mood del dashboard y como simplificación del health score.

### SKU (Stock Keeping Unit)
Código identificador único del producto dentro del tenant. Case-insensitive. No editable una vez creado (para mantener referencias externas).

### Stock
Unidades disponibles de un producto. Derivado de la suma de movimientos, nunca almacenado directamente.

### Stock de seguridad
Días extra de cobertura que el pronóstico incluye para cubrir imprevistos. Default: 3 días.

### Stock negativo
Configuración que permite salidas que dejan el stock en negativo (deshabilitado por default). Útil para negocios que venden antes de recibir mercancía.

### Sobrestock
Producto con más de 90 días de cobertura. Indica plata parada; Inventra lo sugiere como candidato a promocionar.

### Sucursal (branch)
Ubicación física de inventario. El MVP soporta una sola sucursal por tenant; v2 añadirá múltiples con transferencias.

### Tenant
Empresa cliente del sistema. Cada tenant tiene sus propios productos, movimientos, usuarios, configuración.

### Toast
Notificación temporal que aparece en la esquina superior derecha y se auto-descarta en 3.5–5 segundos.

### Último costo (last)
Método de valoración que usa el costo de la última entrada con `unitCost > 0`. Más sencillo pero menos preciso contablemente que WAC.

### Unidad de medida
Cómo se mide el producto: Unidad, Kg, Litro, Caja, Metro, etc. Cada vertical trae una lista sugerida.

### unitCost
Campo de un movimiento de entrada. Costo unitario real de esa compra específica. Se usa en el cálculo de WAC.

### unitPrice
Campo de un movimiento de salida tipo "Venta". Precio real al que se vendió (puede diferir del precio de lista por descuento o promo).

### Urgent (flag en pronóstico)
Indicador que se activa cuando `daysLeft ≤ leadTime`: ya no hay tiempo de recibir el pedido antes de que se agote. La UI muestra "🚨 Pedir ya" en lugar de una fecha.

### Valor del inventario
Suma de `stock × precio` (a precio de venta) o `stock × costo efectivo` (a costo). Se muestra en el dashboard y en el tab "Inventario actual" del reporte.

### Valuación (método de)
Decisión contable sobre cómo calcular el costo efectivo: WAC, FIFO, o Último costo. Configurable por tenant. En Colombia el default habitual es WAC.

### Venta
Motivo de salida que genera ingresos. Es el único motivo para el que se captura `unitPrice` por movimiento.

### Vertical
Tipo de negocio del tenant: retail, bakery, hardware, pharmacy, petshop, other. Determina el catálogo semilla y las listas sugeridas de categorías y unidades.

### WAC
Ver Promedio ponderado.
