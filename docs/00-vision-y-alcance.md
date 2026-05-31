# 00 · Visión y alcance

## Propósito

**Inventra AI** es un sistema de gestión de inventario **adaptable a cualquier tipo de negocio pequeño o mediano en Colombia**, con inteligencia incorporada para que incluso dueños sin formación financiera puedan tomar decisiones de compra, precio y liquidación basadas en datos.

La propuesta de valor es:

> "Un sistema de inventario que no solo registra, sino que le dice al dueño **qué pedir, cuánto y cuándo**, y le avisa de problemas antes de que le cuesten plata."

## Usuarios objetivo

### Persona 1 — Dueño operativo (perfil principal)
- **Quién**: dueño de una tienda de barrio, panadería, ferretería, farmacia o petshop, con 50–500 SKUs activos.
- **Nivel técnico**: bajo. Usa WhatsApp, sabe navegar, no sabe Excel avanzado, nunca ha usado un ERP.
- **Conocimiento financiero**: bajo. No sabe qué es WAC, ABC, rotación, ni COGS.
- **Motivaciones**: no quedarse sin producto estrella, no tener plata parada en productos que no rotan, saber cuánto gana realmente.
- **Frustraciones**: sistemas existentes le piden "configurar categorías fiscales", "método de costeo", "grupos contables" — palabras que no entiende.

### Persona 2 — Administrador contratado (perfil secundario)
- **Quién**: persona empleada (sobrino, administrador, hijo del dueño) que opera el día a día.
- **Nivel técnico**: medio. Usa Excel básico.
- **Motivaciones**: procesos claros, rapidez en registrar movimientos, reportes exportables.

### Persona 3 — Contador externo (perfil terciario)
- **Quién**: contador que revisa los números una vez al mes.
- **Motivaciones**: exportaciones CSV/Excel confiables, trazabilidad de movimientos, cálculos de COGS y margen.

## Diferenciadores frente a la competencia

Los sistemas de inventario del mercado colombiano (Siigo, Alegra, Bsale, etc.) se enfocan en **registro** y **contabilidad**. Inventra se enfoca en **decisiones**.

1. **Inteligencia integrada sin jerga financiera**
   - Semáforo visual (🟢 🟡 🔴) en vez de "score 73/100".
   - ABC renombrado a ⭐ Estrellas / 💪 Buenos / 🔹 Secundarios / 💤 Sin actividad.
   - Recomendaciones en lenguaje plano: "Estos 3 productos se agotan esta semana, pide ya".

2. **Pronóstico de reposición automático**
   - Calcula consumo diario, aplica lead time y stock de seguridad, y dice exactamente qué pedir y cuándo.
   - Bandera 🚨 cuando ya es tarde (no se alcanza a recibir a tiempo).

3. **Valuación de inventario real (WAC, FIFO, último costo)**
   - El costo se actualiza automáticamente cuando cambia el precio de compra.
   - El margen calculado es el **real**, no el ingresado a mano.

4. **Precio de venta por movimiento (descuentos y promos reales)**
   - Una venta puede registrarse con un precio distinto al de lista (descuento, promo, ajuste).
   - Los reportes de rentabilidad muestran precio promedio vs. precio de lista para detectar caídas de margen.

5. **Chat en lenguaje natural**
   - El dueño puede preguntar "¿cuánto arroz tengo?", "¿qué tengo que pedir?", "¿cuánto gané esta semana?" y recibir respuestas directas.

6. **Configurable por vertical**
   - Catálogo semilla, categorías y unidades pre-cargadas según el tipo de negocio: tienda, panadería, ferretería, farmacia, petshop.
   - Opción "Otro" con configuración personalizada para verticales no previstas.

7. **Multi-tenant, multi-sucursal, multi-moneda**
   - Soporta varios negocios en la misma plataforma, cada uno con sus sucursales y su moneda.

## Alcance del MVP

### Incluido en el MVP

- Registro de productos con SKU, categoría, unidad, stock mínimo, costo, precio.
- Registro de movimientos (entradas, salidas, ajustes) con trazabilidad inmutable.
- Cálculo automático de stock a partir de movimientos.
- Valuación por **promedio ponderado (WAC)** como default, con opción de **último costo** y **FIFO**.
- Registro de costo unitario por entrada (para que WAC sea real).
- Registro de precio unitario por salida tipo "Venta" (para ingresos reales).
- Dashboard con salud del inventario y alertas.
- Alertas de stock bajo mínimo.
- Reportes: inventario, movimientos, por categoría, top productos, rentabilidad, pronóstico.
- Exportación CSV por reporte.
- Inteligencia: ABC, pronóstico, recomendaciones automáticas, insights semáforo.
- Chat NLP para consultas frecuentes.
- Onboarding guiado con catálogo semilla por vertical.
- Multi-tenant (una empresa por tenant), un usuario administrador, una sucursal.
- Multi-moneda (selección en onboarding).

### Fuera del MVP (ver roadmap en 07-arquitectura-sugerida)

- Facturación electrónica (DIAN).
- Integración con pasarelas de pago.
- App móvil nativa (se usa la web responsiva).
- Multi-usuario con permisos granulares (roles avanzados). El MVP tiene un único rol "Administrador" por tenant.
- Múltiples sucursales con transferencias entre ellas. El MVP tiene una sucursal por tenant.
- Gestión de proveedores y órdenes de compra formales.
- Trazabilidad por lote / vencimiento (crítico para farmacia, se añade en v2).
- Integración con contabilidad externa.
- Importación masiva desde Excel (deseable para v1.1).
- Notificaciones por email/WhatsApp/push.

## Supuestos de negocio

- El dueño típico tiene entre 50 y 500 SKUs activos.
- El volumen de movimientos es de 10 a 500 por día.
- El dispositivo principal es un computador de escritorio o laptop con Chrome / Edge. El uso en celular es secundario pero debe funcionar.
- La conectividad puede ser intermitente: la app **debería** funcionar parcialmente offline (ver 02 — no funcionales).
- El dueño quiere decisiones, no configuraciones. Todos los defaults deben ser sensatos para un negocio colombiano promedio.

## Criterios de éxito del MVP

1. Un dueño sin experiencia con ERPs **debe** poder crear su empresa, cargar 50 productos y registrar su primera venta en **menos de 20 minutos**.
2. El pronóstico de reposición **debe** estar dentro del ±20% del consumo real cuando hay al menos 30 días de histórico.
3. El margen calculado **debe** coincidir con el de un contador revisando los datos, con diferencias menores al 1% (redondeo).
4. El tiempo de respuesta de cualquier vista principal (dashboard, productos, reportes) **debe** ser menor a 2 segundos con 1.000 productos y 100.000 movimientos.
