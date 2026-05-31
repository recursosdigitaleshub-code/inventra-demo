# 05 · Flujos y vistas

Este documento describe cada pantalla (vista) del sistema y los flujos principales del usuario. Es la referencia de comportamiento para el equipo frontend.

---

## Navegación principal

**Sidebar lateral** (sticky, 240 px ancho, siempre visible en desktop):

- 🏠 **Dashboard** — vista inicial al entrar.
- 📦 **Productos** — catálogo y edición.
- 🔔 **Alertas** — muestra badge con el conteo de productos bajo mínimo.
- ⬇️ **Entradas** — registrar stock in.
- ⬆️ **Salidas** — registrar stock out.
- 📜 **Movimientos** — historial completo.
- 📊 **Reportes** — tabs de reportes.
- 🧠 **Inteligencia** — insights y pronóstico.
- ⚙️ **Configuración** — settings del tenant.

**Footer del sidebar**: nombre del usuario y rol.

**FAB flotante (💬)**: abre el chat en todas las vistas principales.

**Header de vista** (en cada página): `h1` grande con título + subtítulo explicativo + (opcional) botones de acción alineados a la derecha.

---

## V-DS · Dashboard

**URL sugerida**: `/dashboard`

**Propósito**: primera impresión del estado del negocio, sin navegación necesaria.

**Datos mostrados**:
1. **Semáforo de salud**: círculo de progreso con score 0–100, label (Excelente/Bueno/Regular/Crítico), color según score.
2. **Stat cards**:
   - Total de unidades en stock.
   - Valor del inventario (a precio de venta, en moneda del tenant).
   - Productos en alerta (count con badge rojo si > 0).
3. **CTAs rápidos**: "Nueva entrada" y "Nueva salida".
4. **Productos bajo mínimo**: tabla compacta con los 10 productos con stock más crítico. Columnas: SKU, Nombre, Stock actual, Mínimo, Badge estado.
5. **Últimos movimientos**: tabla con los 10 más recientes. Columnas: Fecha, Producto, Tipo, Cantidad (con signo y color).
6. **Recomendaciones**: hasta 3 insight cards si hay problemas críticos (urgentes, por agotarse).

**Estados**:
- Sin productos: estado vacío con CTA "Crea tu primer producto" que lleva a Productos.
- Sin alertas: mensaje "✅ Sin alertas" en la tabla de alertas.
- Sin movimientos: mensaje "📭 Sin movimientos aún".

**Acciones**:
- Click en el semáforo → navega a Inteligencia.
- Click en una fila de producto bajo mínimo → abre modal de producto para agregar stock.
- Click en "Nueva entrada" → navega a `/stock-in`.
- Click en "Nueva salida" → navega a `/stock-out`.

---

## V-PR · Productos

**URL sugerida**: `/products`

**Propósito**: gestionar el catálogo.

**Datos mostrados**:
- Tabla con columnas: SKU, Nombre, Categoría, Unidad, Stock, Mínimo, Costo prom., Precio, Margen (badge), Estado, Acciones.
- Filtros superiores:
  - Búsqueda libre (input).
  - Select de categoría.
  - Select de estado (todo, bajo mínimo, sobre mínimo, sin stock).

**Acciones por fila**:
- ✏️ Editar → abre modal.
- 🗑️ Eliminar → pide confirmación; si tiene movimientos, rechaza con mensaje explicativo y sugiere "desactivar" en su lugar.

**Acciones globales**:
- Botón "+ Nuevo producto" abre modal con formulario vacío.

**Modal de producto**:

Campos:
- SKU (required, string, único por tenant).
- Nombre (required).
- Categoría (required, select con opción "Nueva categoría" que abre prompt).
- Unidad (required, select con opción "Nueva unidad").
- Stock mínimo (number, default `settings.defaultMinStock`).
- Costo de referencia (number, opcional pero fuertemente sugerido).
- Precio de venta (number, required, > 0).
- [Solo al crear] Stock inicial (number, default 0). Genera entrada automática si > 0.
- [Solo al editar] Stock actual (readonly).
- [Solo al editar] Costo promedio actual (readonly, calculado en vivo según método de valoración).
- [Solo al editar] Sección "Agregar stock rápido": cantidad + motivo + botón → crea movimiento sin cerrar el modal.

Validaciones:
- SKU único (case-insensitive) dentro del tenant.
- Precio > 0.
- Costo ≥ 0.
- Stock mínimo ≥ 0.

---

## V-AL · Alertas

**URL sugerida**: `/alerts`

**Propósito**: ver todos los productos bajo mínimo para tomar acción.

**Datos mostrados**:
- Tabla con columnas: SKU, Nombre, Stock actual, Stock mínimo, Faltante, Días de cobertura, Acción sugerida.
- Ordenada por urgencia descendente (faltante mayor primero).

**Acciones**:
- Click en una fila → abre modal del producto con acción "Agregar stock rápido".

**Badge en navegación**: el item "Alertas" del sidebar muestra un badge rojo con el conteo cuando hay alertas activas.

---

## V-SI · Entradas de inventario (Stock In)

**URL sugerida**: `/stock-in`

**Propósito**: registrar entradas (compras, devoluciones, producción).

**Layout**: grid de 2 columnas: formulario a la izquierda, últimas 8 entradas a la derecha.

**Formulario**:
- Producto (select, required, muestra SKU y nombre).
- Cantidad (number, required, > 0).
- Costo unitario de esta compra (number, opcional). Si el usuario lo ingresa, el sistema lo guarda en el movimiento y actualiza WAC.
- Motivo (select, required): Compra, Devolución de cliente, Producción, Ajuste por conteo, Otro.
- Referencia (text, opcional, ej: "FAC-1011").
- Botón submit: "⬇️ Registrar entrada".

**Hint dinámico al seleccionar producto**:
> Stock: **45 Unidad** · Costo actual (Promedio ponderado): **$2.443**

**Comportamiento del campo "Costo unitario"**:
- Si el usuario selecciona un producto y el campo está en 0 → se pre-llena con el costo promedio actual.
- El usuario puede sobrescribirlo con el costo real de la compra actual.
- Si deja 0 (o borra), el movimiento se guarda sin `unitCost` y no afecta el WAC.

**Tabla lateral**: últimas 8 entradas con fecha, producto, cantidad (verde), motivo.

**Post-submit**:
- Toast verde: "Entrada de [qty] unidad(es) registrada."
- Formulario se limpia.
- Tabla lateral se actualiza.

---

## V-SO · Salidas de inventario (Stock Out)

**URL sugerida**: `/stock-out`

**Propósito**: registrar salidas (ventas, consumos, mermas).

**Layout**: igual que entradas — formulario + últimas 8 salidas.

**Formulario**:
- Producto (select, required, muestra stock disponible en el label).
- Cantidad (number, required, > 0, con validación en vivo vs. stock disponible).
- Motivo (select, required): **Venta**, Consumo interno, Merma / daño, Devolución a proveedor, Ajuste por conteo (−), Otro.
- Precio de venta unitario (number, opcional, **solo visible si motivo = "Venta"**).
- Referencia (text, opcional).
- Botón submit: "⬆️ Registrar salida".

**Comportamiento del campo "Precio de venta unitario"**:
- Aparece dinámicamente al seleccionar "Venta" como motivo.
- Se pre-llena con el precio de lista del producto seleccionado.
- El usuario puede bajar el precio (descuento, promo) o subirlo (ajuste).
- Si queda en 0 (el usuario lo borró), el sistema usa el precio de lista como fallback en los cálculos.
- Hint: "Si vendiste a un precio distinto al de lista (descuento, promoción, ajuste), ingrésalo aquí. Si lo dejas en 0 se usa el precio del producto."

**Validación en vivo de cantidad**:
- Al cambiar cantidad o producto: calcula `stock − qty`.
- Si `< 0`: desactiva el botón submit, muestra error rojo: "Stock insuficiente. Disponible: [X]."
- Si `≥ 0`: botón habilitado.

**Hint del producto seleccionado**:
> Disponible: **45 Unidad** · Mínimo: 10 · Precio de lista: **$3.500**

**Post-submit**:
- Toast verde: "Salida de [qty] unidad(es) registrada."
- Formulario se limpia.

---

## V-MV · Historial de movimientos

**URL sugerida**: `/movements`

**Propósito**: auditoría completa de movimientos.

**Datos mostrados**:
- Badges superiores: Entradas totales (en filtro), Salidas totales, Neto.
- Filtros: producto (select), tipo (select: Entradas, Salidas, Ajustes +/−).
- Tabla con columnas: #, Fecha, Producto (nombre + SKU), Tipo (badge), Cantidad (signo + color), Saldo acumulado, Motivo, Referencia.
- Ordenada por fecha descendente (más reciente primero).

**Saldo acumulado**:
- Se calcula por producto en orden cronológico ascendente.
- Se muestra en orden descendente (pero el cálculo es cronológico hacia atrás).
- Representa el stock del producto inmediatamente después de cada movimiento.

**Estados**:
- Sin movimientos: "Sin movimientos registrados".
- Con filtros sin resultados: "No hay movimientos que coincidan con los filtros".

---

## V-RP · Reportes

**URL sugerida**: `/reports?tab=<tab>&from=<date>&to=<date>&...`

**Layout**:
- Header con filtros globales: desde, hasta, producto, categoría, tipo movimiento.
- Stat cards con totales del rango: Total productos, Entradas, Salidas (con comparación vs entradas), Valor del inventario.
- Barra de tabs: Inventario | Movimientos | Por categoría | Top productos | Rentabilidad | Pronóstico.
- Badge "N movimiento(s) en el rango".
- Botón "Exportar CSV".
- Contenido del tab seleccionado.

**Persistencia**: el tab activo y los filtros **deberían** persistirse en URL (querystring) para permitir compartir/bookmark.

### Tab 1: Inventario actual

Descrito en RF-RP-01.

### Tab 2: Movimientos

Descrito en RF-RP-02. Incluye nota al pie sobre los valores en gris (fallback a catálogo).

### Tab 3: Por categoría

Descrito en RF-RP-03.

### Tab 4: Top productos

Descrito en RF-RP-04. Incluye barra visual de proporción relativa al producto más movido.

### Tab 5: Rentabilidad

Descrito en RF-RP-05. Incluye:
- Header: alerta con el método de valoración vigente y explicación breve.
- Si hay productos sin costo vendidos: alerta amarilla indicando cuántos.
- Stat cards: Ingresos, COGS, Utilidad bruta, Margen bruto %.
- Tabla principal.
- Dos bloques expandibles (`<details>`):
  1. "¿Cómo se calculan los ingresos cuando el precio de venta varía?"
  2. "¿Cómo se calcula el costo cuando los precios de compra cambian?"

### Tab 6: Pronóstico

Descrito en RF-RP-06.

---

## V-IN · Inteligencia del inventario

**URL sugerida**: `/insights`

**Propósito**: centralizar recomendaciones, pronóstico y clasificación en una vista accionable.

**Estructura vertical**:

### Bloque 1: Mood general (tarjeta grande superior)

- Icon grande (🟢 / 🟡 / 🔴).
- Título coloreado.
- Mensaje contextual.
- Border-left grueso del color del mood.

Lógica en RN-HS-004.

### Bloque 2: Resumen rápido (4 summary cards interactivas)

Grid responsive de 4 cards, cada una clickeable con hover effect (translateY + shadow).

Cada card tiene:
- Header: emoji + label uppercase.
- Valor principal: número grande o monto en moneda del tenant.
- Sub-línea: descripción.
- Lista de 3 items con nombre + dato relevante.
- Indicador "+ N más" si hay más de 3.
- CTA inferior: "Ver → " con navegación.

**Las 4 cards**:

| Card | Dato principal | Lista items | CTA navegación |
|------|---------------|-------------|----------------|
| 💰 Vendido esta semana | Monto (últimos 7d) | Top 3 productos con su aporte | Reportes > Top productos |
| 🔔 En alerta | Count bajo mínimo | Top 3 con stock vs mínimo | Alertas |
| 🔮 Por reponer pronto | Count con reorden sugerido | Top 3 con días restantes | Scroll a sección "Pronóstico" |
| 💤 Sin movimiento | Count dead stock | Top 3 con días inactivos | Productos |

### Bloque 3: Clasificación de productos (4 cards Pareto)

Cards con emoji grande, count, label amigable, hint. Ver RN-AB-003.

Bloque expandible abajo: "¿Cómo se clasifican los productos?" (explicación del 80/20 en lenguaje plano).

### Bloque 4: Recomendaciones automáticas

Lista vertical de insight cards generadas por `computeInsights()`.

Cada card:
- Border-left grueso del color según nivel (danger/warning/info/success).
- Icon emoji.
- Título bold.
- Mensaje descriptivo.
- Chips con los primeros productos afectados (máx 5) + "+ N más" si exceden.

### Bloque 5: Pronóstico de reposición

ID del contenedor: `forecast-section` (para scroll desde summary cards).

- Tabla con columnas: Producto, Stock, Consumo diario, Cobertura, Cantidad sugerida, Pedir antes del, Prioridad.
- Ordenada por `daysLeft` ascendente.
- Filas con `urgent = true` muestran "🚨 Pedir ya" en rojo.

Bloque expandible: "¿Cómo se calcula el pronóstico?" con los supuestos (lead time 7d, seguridad 3d, cobertura 30d).

---

## V-CF · Configuración

**URL sugerida**: `/settings`

**Propósito**: modificar preferencias del tenant.

**Secciones**:

1. **Datos de la empresa** (edit): nombre, NIT, email, teléfono, moneda, zona horaria.

2. **Valorización**:
   - Método (select: Promedio ponderado / FIFO / Último costo).
   - Nota explicativa de cada método.

3. **Stock**:
   - Permitir stock negativo (toggle).
   - Stock mínimo por defecto.
   - Umbral de aprobación de ajustes.

4. **Usuarios** (solo listado en MVP):
   - Tabla de usuarios activos.
   - En v2: permisos, roles, invitaciones.

5. **Datos**:
   - Botón "Exportar backup" (descarga JSON completo).
   - Botón "Restaurar demo" (con confirmación, reemplaza datos).
   - Botón "Iniciar empresa nueva" (con confirmación, limpia todo).

---

## V-CH · Chat NLP (drawer flotante)

**No es una URL independiente** — es un drawer que se superpone a la vista activa.

**Disparador**: botón FAB `💬` en la esquina inferior derecha, presente en todas las vistas principales (excepto onboarding).

**Layout del drawer** (cuando está abierto):
- Fixed bottom-right, 380 px ancho, ~580 px alto.
- Header azul primario con nombre "Asistente Inventra" + botón cerrar ✕.
- Body scrollable con historial de mensajes.
- Chips sugeridos bajo el último mensaje (siempre visibles para reducir fricción).
- Input de texto con botón "Enviar".

**Mensajes**:
- Bot: alineado a la izquierda, avatar 🤖, fondo surface-2.
- Usuario: alineado a la derecha, fondo primary-soft.
- Primer mensaje al abrir: "¡Hola! Soy el asistente de Inventra. Pregúntame en lenguaje natural sobre stock, ventas, alertas o pídeme un reporte rápido."

**Chips sugeridos** (iniciales):
- ¿Qué debo reponer?
- Stock bajo
- Top productos
- Valor de inventario
- Margen promedio
- Productos muertos
- Salud del inventario

**Comportamiento**:
- El chat persiste historial mientras el drawer esté abierto (se cierra al recargar).
- Enter o click en enviar dispara la intención.
- Click en chip envía ese texto como si lo hubiera escrito el usuario.
- Si el input está vacío, botón deshabilitado.

---

## V-OB · Onboarding

**URL sugerida**: `/onboarding` (redirigido automáticamente si no hay tenant configurado).

**Estilo**: pantalla limpia, centered, con barra de progreso opcional en la versión multi-step.

### Modo single-page (default)

Todo en una sola vista, secciones apiladas:

1. **🏢 Datos de la empresa**: nombre, NIT, email, teléfono, moneda, zona horaria.
2. **🏷️ Tipo de negocio**: grid de 6 cards. Al seleccionar, pre-carga catálogo.
3. **👤 Usuario administrador**: nombre, email, contraseña.
4. **📍 Sucursal y preferencias**: sucursal, dirección, bodega, método valorización, negative stock, umbral ajustes.
5. **📦 Catálogo inicial**:
   - Tabla editable con productos pre-cargados.
   - Formulario para agregar más.
   - Resumen: X productos · Y categorías · Z unidades.
6. **Footer sticky**: texto "Puedes modificar todo después..." + botón "✓ Crear empresa".

### Modo multi-step (legacy, disponible pero no default)

6 pasos con barra de progreso:
- Paso 0: Bienvenida con features.
- Paso 1: Empresa.
- Paso 2: Vertical.
- Paso 3: Catálogo.
- Paso 4: Admin.
- Paso 5: Sucursal + preferencias.
- Paso 6: Resumen de confirmación.

---

## Flujos principales (user journeys)

### Flujo 1: Nuevo cliente se registra

```
1. Abre URL → redirige a /onboarding.
2. Completa datos empresa.
3. Elige vertical → se pre-carga catálogo.
4. Ajusta/agrega productos.
5. Crea usuario admin.
6. Configura sucursal y valorización.
7. Click "✓ Crear empresa".
8. Redirige a /dashboard con toast "¡Bienvenido, [Empresa]!".
```

### Flujo 2: Registrar una venta del día

```
1. Desde dashboard → click "Nueva salida" (o navega a /stock-out).
2. Selecciona producto (autocompletado por nombre o SKU).
3. Ingresa cantidad — validación en vivo contra stock disponible.
4. Selecciona motivo: "Venta" → aparece campo de precio.
5. Ajusta precio si hay descuento (o deja el sugerido).
6. Click "Registrar salida".
7. Toast "Salida de 3 unidad(es) registrada."
8. Tabla de últimas salidas se actualiza.
```

### Flujo 3: Registrar entrada con nuevo costo de compra

```
1. Desde dashboard → click "Nueva entrada".
2. Selecciona producto.
3. Hint muestra: "Stock: 20 Unidad · Costo actual (WAC): $2.400".
4. Ingresa cantidad (30).
5. El campo "Costo unitario" se pre-llena con $2.400. Usuario lo cambia a $2.500 (el nuevo precio del proveedor).
6. Selecciona motivo: "Compra".
7. Ingresa referencia: "FAC-1011".
8. Click "Registrar entrada".
9. Toast "Entrada de 30 unidad(es) registrada.".
10. A partir de ahora, costOf(p) se recalcula: WAC = (20×2400 + 30×2500) / 50 = $2.460.
```

### Flujo 4: Revisar qué pedir esta semana

```
1. Desde dashboard → click "🧠 Inteligencia" en sidebar.
2. Lee el mood general (🟡 "Algunos puntos de atención").
3. Summary card "🔮 Por reponer pronto" muestra 4 productos con días restantes.
4. Click en esa card → scroll a sección "Pronóstico de reposición".
5. Lee la tabla con cantidades sugeridas y fechas límite.
6. Click en producto específico → abre modal del producto para agregar stock o ir a /stock-in.
```

### Flujo 5: Reporte mensual para el contador

```
1. Navega a /reports.
2. Filtra por rango: desde = 1-mar-2026, hasta = 31-mar-2026.
3. Click tab "Rentabilidad".
4. Revisa stat cards: Ingresos $12.450.000, COGS $7.800.000, Utilidad $4.650.000, Margen 37.3%.
5. Click "Exportar CSV" → descarga inventra-rentabilidad.csv.
6. Envía el archivo al contador por email.
```

### Flujo 6: Consulta rápida por chat

```
1. Abre el chat (click en 💬).
2. Escribe: "cuanto arroz tengo".
3. Bot: "📦 Arroz Diana 500g: 45 Unidad (mínimo 10). ✅ OK."
4. Escribe: "que tengo que pedir esta semana".
5. Bot: "📋 Productos a reponer:\n• Pan tajado Bimbo — pedir 28 Unidad (quedan 4 días)\n• Galletas Saltín Noel — pedir 20 Unidad (🚨 pedir ya)\n..."
```
