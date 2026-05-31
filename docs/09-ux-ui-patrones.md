# 09 · Patrones UX / UI

Este documento define el design system y los patrones de interacción que la implementación real debe respetar para mantener la experiencia del prototipo.

---

## Principios de diseño

1. **Lenguaje antes que jerga**. Nunca mostrar "ABC score" o "health index"; usar "Estrellas" o "Semáforo".
2. **Decisiones antes que datos crudos**. Mostrar el "qué hacer" antes que el "qué es". Ejemplo: "Pide 30 unidades hoy" en vez de "Cobertura: 4.2 días".
3. **Colores semánticos consistentes**. Verde = bueno / OK. Amarillo = advertencia. Rojo = crítico. Azul = informativo. Gris = neutral / inactivo.
4. **Nunca dependas solo del color**. Siempre acompañar con icono o texto para daltonismo.
5. **Estados vacíos útiles**. Nunca una tabla vacía sin explicación. Siempre un CTA hacia la acción siguiente.
6. **Confirmaciones para acciones destructivas**. Borrar, restaurar demo, empezar empresa nueva: siempre con `confirm()` o modal.
7. **Feedback inmediato**. Toasts verdes para éxito, rojos para error, 3.5–5 s.

---

## Design tokens

### Colores base

```css
/* Background y superficie */
--bg: #0f172a;                /* fondo del sidebar (dark) */
--surface: #ffffff;           /* superficie de cards y modales */
--surface-2: #f8fafc;         /* fondo del body, hover rows */
--surface-3: #f1f5f9;         /* inputs, code, hover buttons */
--border: #e2e8f0;

/* Texto */
--text: #0f172a;              /* texto principal */
--muted: #64748b;             /* texto secundario, hints, labels */

/* Semánticos */
--primary: #2563eb;           /* azul — acciones principales, info */
--primary-hover: #1d4ed8;
--primary-soft: #eff6ff;      /* fondo suave para badges primary */

--success: #16a34a;           /* verde — ok, positivo */
--success-soft: #dcfce7;

--warning: #d97706;           /* naranja — advertencia, cuidado */
--warning-soft: #fef3c7;

--danger: #dc2626;            /* rojo — error, crítico */
--danger-soft: #fee2e2;
```

### Espaciado y radios

```css
--radius: 6px;                /* inputs, badges, botones */
--radius-lg: 12px;            /* cards, modales */

/* Espaciados: 4, 8, 12, 16, 20, 24, 32, 40 px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(15,23,42,.06);
--shadow:    0 4px 12px rgba(15,23,42,.08);
--shadow-lg: 0 10px 24px rgba(15,23,42,.12);
```

### Tipografía

- Base: 14 px, line-height 1.5.
- H1: 22 px bold.
- H2: 18 px bold.
- Pequeño / labels: 12–13 px.
- Badges: 11 px uppercase letter-spacing 0.04 em.
- Números en tabla: `font-variant: tabular-nums` para alineación correcta.

---

## Componentes

### Button

**Variantes**:
- `btn` (default): fondo surface, borde gris, hover surface-3.
- `btn-primary`: fondo primary, texto blanco, hover primary-hover.
- `btn-sm`: padding reducido (6 px 12 px), fuente 12 px.
- `disabled`: `opacity: 0.5`, `cursor: not-allowed`.

**Estructura**:
```html
<button class="btn btn-primary">⬇️ Registrar entrada</button>
```

### Badge

Etiqueta inline pequeña para estados y clasificaciones.

**Variantes**:
- `badge-ok` (verde): OK, surtido.
- `badge-warn` (amarillo): advertencia, bajo margen.
- `badge-danger` (rojo): bajo mínimo, urgente.
- `badge-info` (azul): información, neutro positivo.
- `badge-muted` (gris): inactivo, sin datos.

**Usos documentados**:
- Estado de stock en tabla de productos.
- Tipo de movimiento (entrada = ok verde, salida = warn).
- Margen calculado según umbrales (ver RN-PR-006).
- Prioridad en pronóstico (urgente rojo, alta amarillo, media azul).

### Stat card

Tarjeta de indicador grande para el dashboard y headers de reportes.

**Estructura**:
```html
<div class="stat-card">
  <div class="stat-label">Valor del inventario</div>
  <div class="stat-value">$12.450.000</div>
  <div class="stat-hint">A precio de venta</div>
</div>
```

**Variantes**:
- `.stat-card.ok` — border-left verde para indicadores positivos.
- `.stat-card.alert` — border-left rojo para alertas.

### Insight card

Tarjeta de recomendación con icono + título + mensaje + productos opcionales.

**Estructura**:
```html
<div class="insight warning">
  <div class="insight-icon">⏰</div>
  <div>
    <div class="insight-title">3 productos se están agotando</div>
    <div class="insight-msg">Entre 3 y 10 días de cobertura. Planifica la compra pronto.</div>
    <div class="insight-chips">
      <span class="chip">Pan tajado</span>
      <span class="chip">Galletas</span>
    </div>
  </div>
</div>
```

**Variantes**: `.danger`, `.warning`, `.info`, `.success` con border-left y colores correspondientes.

### Summary card (interactiva)

Tarjeta clickeable con efecto hover (translateY + shadow). Usada en la vista Inteligencia (ver V-IN).

**Estructura completa**:
```html
<div class="summary-card" onclick="..." style="background: var(--primary-soft)">
  <div class="summary-card-label">💰 Vendido esta semana</div>
  <div class="summary-card-value">$1.240.000</div>
  <div class="summary-card-sub">34 unidad(es) en 7 días</div>
  <div class="summary-card-list">
    <div class="summary-card-item">
      <span class="summary-card-item-name">Arroz Diana 500g</span>
      <span class="summary-card-item-val">$450.000</span>
    </div>
    ...
    <div class="summary-card-more">+ 5 más</div>
  </div>
  <div class="summary-card-cta">Ver top productos →</div>
</div>
```

**Interacciones**:
- Hover: `translateY(-2px)` + shadow más pronunciado.
- Click: navega a la vista indicada por el CTA (ver RF-IN-003).
- Cursor pointer.
- Estado vacío: mostrar mensaje ok en verde suave ("Sin ventas registradas esta semana").

### Health gauge (semáforo principal)

SVG circular con `stroke-dasharray` animado según score.

**Colores según score**:
- Score ≥ 70: verde (`var(--success)`).
- Score 50–69: amarillo (`var(--warning)`).
- Score < 50: rojo (`var(--danger)`).

**Centro**: número grande + label pequeño debajo.

En la vista Inteligencia, se complementa con un "mood" (🟢/🟡/🔴) calculado a partir de alertas + reposiciones (ver RN-HS-004).

### Table

```html
<table class="table">
  <thead>
    <tr>
      <th>SKU</th>
      <th>Producto</th>
      <th class="num">Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ARR-001</code></td>
      <td>Arroz Diana 500g</td>
      <td class="num">45</td>
    </tr>
  </tbody>
</table>
```

**Convenciones**:
- Headers `<th>`: uppercase, gris muted, letter-spacing.
- Celdas numéricas: `class="num"` — text-align right, tabular-nums.
- Hover row: fondo surface-2.
- Código (SKU): `<code>` con fondo surface-3.
- Si la tabla tiene > 500 filas: paginación o scroll con altura fija.

### Form

```html
<form>
  <div class="form-grid">
    <div class="field">
      <label class="required">Cantidad</label>
      <input name="quantity" type="number" required min="1">
      <div class="hint">Stock disponible: 45 Unidad</div>
    </div>

    <div class="field invalid">
      <label>Precio</label>
      <input name="price" type="number">
      <div class="error">Debe ser mayor a 0</div>
    </div>
  </div>
</form>
```

**Convenciones**:
- Label clara encima del input.
- `.required::after { content: " *"; color: var(--danger); }` indica campos obligatorios.
- Hint debajo para información auxiliar (gris).
- Error inline en rojo, solo cuando hay problema.
- Focus visible: border primary + soft shadow azul.
- Layout responsive: `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`.

### Modal

```html
<div class="modal-overlay" onclick="close()">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <h2>Editar producto</h2>
      <button class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <!-- form -->
    </div>
    <div class="modal-footer">
      <button class="btn">Cancelar</button>
      <button class="btn btn-primary">Guardar</button>
    </div>
  </div>
</div>
```

- Overlay: `rgba(15,23,42,0.5)` con blur sutil.
- Modal centrado, max-width 720 px.
- Cerrar: click en overlay, botón ✕, tecla Escape.

### Toast

```html
<div class="toast success">
  <span class="toast-icon">✓</span>
  <span class="toast-text">Entrada de 30 unidad(es) registrada.</span>
</div>
```

- Posición: fixed top-right, 16 px margen.
- Animación: slide-in desde derecha 200 ms.
- Auto-dismiss: 3.5 s (éxito/info) o 5 s (error).
- Border-left 4 px del color semántico.

### Chat drawer

- Posición: fixed bottom-right, 16 px margen.
- Ancho 380 px, alto ~580 px (responsive: full-screen en móvil).
- Abierto / cerrado controlado por un botón FAB (💬) siempre visible.
- Mensajes bot alineados izquierda (avatar 🤖, fondo surface-2).
- Mensajes usuario alineados derecha (fondo primary-soft).
- Chips sugeridos visibles siempre, por encima del input, para reducir fricción.

### Details / Collapsible (explicaciones)

Bloque expandible para información avanzada (fórmulas, supuestos).

```html
<details class="explain">
  <summary>¿Cómo se calcula el pronóstico?</summary>
  <p>Para cada producto estimamos cuánto se consume por día...</p>
  <ul>
    <li>...</li>
  </ul>
</details>
```

- Usa `<details>` nativo por accesibilidad.
- Summary con prefijo visual (ⓘ cerrado, ▾ abierto) vía CSS.
- Cuando abierto, el contenido **no** debe interrumpir el layout principal — va al final de la sección.

### Empty state

```html
<div class="empty">
  <div class="empty-icon">📭</div>
  <strong>Sin movimientos aún</strong>
  <div>Registra la primera entrada del día.</div>
  <button class="btn btn-primary" onclick="...">Nueva entrada</button>
</div>
```

Centered, icono grande en emoji, título bold, descripción y CTA cuando aplica.

---

## Patrones de interacción

### Auto-save vs submit explícito

- **Formularios simples** (agregar producto, nueva entrada, nueva salida): submit explícito, feedback con toast.
- **Configuración**: auto-save con debounce 500 ms, toast suave "Cambios guardados" al completar.

### Validación en vivo

- **Cantidad de salida vs stock disponible**: on input, calcular y mostrar error si exceso. Deshabilitar botón submit mientras haya error.
- **SKU único**: validación async al salir del campo (on blur). Debounce 300 ms.
- **Precio / costo**: validar > 0 on blur.

### Feedback al seleccionar producto

En entradas y salidas, al seleccionar un producto el formulario **debe** mostrar un hint dinámico con información contextual:
- Entrada: stock actual + costo promedio actual.
- Salida: stock disponible + mínimo + precio de lista.

### Pre-llenado inteligente

- **Campo costo unitario en entrada**: si está en 0, pre-llena con costo promedio actual. El usuario puede sobrescribir.
- **Campo precio de venta en salida**: si motivo = "Venta" y está en 0, pre-llena con precio de lista.

### Acciones destructivas

Siempre con confirmación explícita (modal o `confirm()`):
- Eliminar producto.
- Restaurar demo.
- Empezar empresa nueva.
- Descartar cambios no guardados (al navegar).

### Navegación entre vistas

- Sidebar siempre visible en desktop (sticky).
- Items con badge numérico cuando hay alertas (ej. "Alertas · 3").
- Item activo con background primary y texto blanco.
- En móvil: menú hamburguesa que desliza el sidebar.

### Responsive

Breakpoints:
- `< 768 px`: móvil. Sidebar oculto por default. Tablas pueden colapsar a cards.
- `768–1024 px`: tablet. Sidebar visible, grids de 2 columnas donde había 4.
- `> 1024 px`: desktop. Layout completo.

En reportes densos, considerar `overflow-x: auto` en el wrapper de la tabla para permitir scroll horizontal en pantallas estrechas, antes que degradar el layout.

---

## Accesibilidad

Ver también documento 02, sección RNF-AC.

Puntos clave específicos de UI:

- Todos los botones tienen `aria-label` si su contenido es solo un emoji.
- Los modales tienen `role="dialog"`, `aria-labelledby`, `aria-modal="true"`.
- Los toasts tienen `role="status"` (éxito/info) o `role="alert"` (error).
- Los íconos decorativos tienen `aria-hidden="true"`.
- El orden de tabulación es lógico (siguiendo el flujo visual).
- Focus visible con `outline: 2px solid var(--primary)` (no quitarlo con `outline: none` sin reemplazo).

---

## Formato de datos

### Moneda

Según moneda del tenant:

| Moneda | Formato | Ejemplo |
|--------|---------|---------|
| COP | `$1.234.567` (punto miles, sin decimales) | `$2.500` |
| USD, MXN | `$1,234.56` (coma miles, 2 decimales) | `$25.00` |
| EUR | `€1.234,56` (punto miles, coma decimal) | `€25,00` |
| PEN | `S/ 1,234.56` | `S/ 25.00` |

**Implementación sugerida**: un pipe `money` en Angular que recibe `valor + currency` y formatea con `Intl.NumberFormat(locale)`.

### Fechas

**Display**: `dd/mm/aaaa` o `dd/mm/aaaa, HH:MM` para timestamps. Usar la TZ del tenant.

**API / CSV**: ISO 8601 UTC. `2026-04-19T10:30:00Z`.

### Números

Enteros en tablas con `tabular-nums` para alinear visualmente. Decimales a 2 posiciones para montos, 4 para costos/precios unitarios donde aplique.

---

## Iconografía

Emojis se usan por su reconocibilidad universal y cero-coste de implementación. Lista de emojis canónicos:

| Emoji | Uso |
|-------|-----|
| 🏠 | Dashboard |
| 📦 | Productos |
| 🔔 | Alertas |
| ⬇️ | Entradas |
| ⬆️ | Salidas |
| 📜 | Movimientos |
| 📊 | Reportes |
| 🧠 | Inteligencia |
| ⚙️ | Configuración |
| 💬 | Chat |
| 🟢 / 🟡 / 🔴 | Semáforo general |
| ⭐ | Estrellas (ABC clase A) |
| 💪 | Buenos (B) |
| 🔹 | Secundarios (C) |
| 💤 | Sin actividad / dead stock |
| 🚨 | Urgente, pedir ya |
| ⏰ | Por agotarse |
| 💰 | Revenue, valor |
| 📉 | Margen bajo |
| 📈 | Top productos, rotación |
| 🎯 | Objetivos, metas |
| ✅ | OK, todo bajo control |
| ⚠️ | Advertencia |
| ✕ | Cerrar |
| ✓ | Confirmar, éxito |

**Consistencia**: una vez se elige un emoji para un concepto, se usa en todos lados. No mezclar 📦 y 📬 para "productos".

---

## Tono de voz (copy)

### Reglas

1. **Español Colombia**. Formas como: "ingresa", "planifica", "prueba", "dime", "pregunta". **Nunca**: "ingresá", "planificá", "probá", "decime", "preguntá".
2. **Segunda persona (tuteo)**, no usted. "Tu inventario está..." no "Su inventario está...".
3. **Directo y breve**. Máximo 2 oraciones en títulos. Párrafos cortos en explicaciones.
4. **Sin tecnicismos innecesarios**. "Cobertura" sí ("te queda para 4 días"), "stock keeping unit" no.
5. **Números redondeados en UX**. "4 días", no "4.237 días". Los reportes pueden ser más precisos.

### Ejemplos de copy

**Bueno**:
- "Estos 3 productos se agotan esta semana. Revisa el pronóstico."
- "Sin ventas registradas esta semana."
- "Falta costo" (badge cuando no hay costo definido).

**Malo**:
- "Se detectaron 3 SKUs con stock projected below safety threshold." ❌
- "Empezá por revisar el forecast." ❌ (voseo + anglicismo)
- "Usted no tiene movimientos registrados." ❌ (formal de más)
