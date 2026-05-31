# 03 · Modelo de datos

Este documento define las entidades, sus campos, relaciones y reglas de integridad. Está pensado para ser mapeado a una base de datos relacional (PostgreSQL recomendado) pero los nombres y tipos son lógicos — el equipo puede adaptarlos a la convención del stack elegido.

---

## Diagrama conceptual

```
┌─────────┐  1     *  ┌─────────┐  1     *  ┌─────────┐
│ Tenant  │──────────→│ Branch  │           │ Product │
└─────────┘           └─────────┘           └─────────┘
     │ 1                                          │ 1
     │                                            │
     │ *                                          │ *
┌─────────┐  1     *  ┌──────────┐                │
│  User   │           │ Settings │                │
└─────────┘           └──────────┘                │
                                                  │
                      ┌──────────┐  *          1  │
                      │ Movement │ ──────────────→│
                      └──────────┘
```

Relaciones clave:
- Un **Tenant** tiene N usuarios, N sucursales, N productos, 1 configuración.
- Un **Product** pertenece a un Tenant y tiene N movimientos.
- Un **Movement** pertenece a un Product (y transitivamente a un Tenant).
- El **stock** no se almacena: se deriva sumando movimientos.

---

## Entidad: Tenant (empresa)

Representa a un negocio. Un tenant es la unidad de aislamiento lógico.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------|-------------|
| `id` | UUID | sí | Identificador único. |
| `name` | string(120) | sí | Nombre del negocio ("Tienda Don Pepe"). |
| `taxId` | string(40) | sí | NIT/RUC/Tax ID. |
| `vertical` | enum | sí | `retail` / `bakery` / `hardware` / `pharmacy` / `petshop` / `other`. |
| `customVerticalName` | string(80) | no | Descripción personalizada si vertical = `other`. |
| `country` | string(3) | sí | ISO 3166-1 alpha-3, default `COL`. |
| `currency` | string(3) | sí | ISO 4217: `COP`, `USD`, `MXN`, `EUR`, `PEN`, `CLP`, `ARS`, `BRL`. |
| `timezone` | string(60) | sí | IANA timezone, default `America/Bogota`. |
| `email` | string(254) | no | Email de contacto de la empresa. |
| `phone` | string(30) | no | Teléfono de contacto. |
| `status` | enum | sí | `active` / `suspended` / `deleted`. |
| `createdAt` | timestamp | sí | UTC. |
| `updatedAt` | timestamp | sí | UTC. |

**Índices**:
- PK en `id`.
- Único (`taxId`) para prevenir duplicados.
- Índice en `status` para queries de administración.

**Reglas de integridad**:
- `vertical = 'other'` implica `customVerticalName` no vacío.
- `currency` válido contra lista.

---

## Entidad: User (usuario)

Representa a una persona con acceso al sistema.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------|-------------|
| `id` | UUID | sí | Identificador único. |
| `tenantId` | UUID | sí | FK → Tenant. |
| `name` | string(120) | sí | Nombre completo. |
| `email` | string(254) | sí | Email (único dentro del tenant). |
| `passwordHash` | string(255) | sí | Hash seguro (bcrypt/argon2). **Nunca en texto plano**. |
| `role` | enum | sí | En MVP: `admin`. En v2: `admin`, `operator`, `viewer`. |
| `lastLoginAt` | timestamp | no | UTC. |
| `status` | enum | sí | `active` / `disabled`. |
| `createdAt` | timestamp | sí | UTC. |
| `updatedAt` | timestamp | sí | UTC. |

**Índices**:
- PK en `id`.
- Único (`tenantId`, `email`).
- Índice en `tenantId`.

**Reglas de integridad**:
- Al eliminar un tenant se **deben** eliminar en cascada sus usuarios.
- Un usuario pertenece a un solo tenant (no hay multi-tenant por usuario en MVP).

---

## Entidad: Branch (sucursal)

Representa una ubicación física donde hay inventario. En el MVP, cada tenant tiene una sucursal principal.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------|-------------|
| `id` | UUID | sí | Identificador único. |
| `tenantId` | UUID | sí | FK → Tenant. |
| `name` | string(120) | sí | Nombre ("Sucursal Principal", "Bodega Norte"). |
| `address` | string(255) | no | Dirección física. |
| `warehouse` | string(120) | no | Nombre de la bodega principal. |
| `isPrimary` | boolean | sí | Indica si es la sucursal principal (única por tenant en MVP). |
| `createdAt` | timestamp | sí | UTC. |
| `updatedAt` | timestamp | sí | UTC. |

**Reglas de integridad**:
- Por tenant **debe** existir al menos una sucursal con `isPrimary = true`.
- En v1 no hay transferencias entre sucursales ni inventario por sucursal — todo el stock se agrega a nivel tenant. El campo se prevé para v2.

---

## Entidad: Settings (configuración del tenant)

Preferencias del tenant. Uno a uno con Tenant.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------|-------------|
| `tenantId` | UUID | sí | PK y FK → Tenant. |
| `valuationMethod` | enum | sí | `avg` (promedio ponderado, default) / `fifo` / `last`. |
| `allowNegativeStock` | boolean | sí | Default `false`. |
| `defaultMinStock` | int | sí | Default `5`. |
| `adjustThreshold` | decimal(14,2) | no | Default `500`. Umbral en moneda local para aprobación de ajustes grandes. Reservado; en MVP es informativo. |
| `updatedAt` | timestamp | sí | UTC. |

**Reglas**:
- Si `allowNegativeStock = false`, el servicio de movimientos **debe** rechazar salidas que dejen stock negativo.

---

## Entidad: Product (producto)

Representa un SKU en el catálogo del tenant.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------|-------------|
| `id` | UUID | sí | Identificador único. |
| `tenantId` | UUID | sí | FK → Tenant. |
| `sku` | string(40) | sí | Único por tenant, comparación case-insensitive. |
| `name` | string(160) | sí | Nombre comercial del producto. |
| `category` | string(80) | sí | Categoría libre ("Abarrotes", "Aseo", "Salud"). |
| `unit` | string(30) | sí | Unidad de medida ("Unidad", "Kg", "Litro", "Caja"). |
| `minStock` | int | sí | Stock mínimo de reorden. Default `settings.defaultMinStock`. |
| `cost` | decimal(14,4) | no | Costo de referencia inicial. Usado como fallback cuando no hay movimientos con `unitCost`. |
| `price` | decimal(14,4) | sí | Precio de venta unitario de lista. |
| `active` | boolean | sí | Default `true`. `false` = oculto de ventas pero visible en históricos. |
| `createdAt` | timestamp | sí | UTC. |
| `updatedAt` | timestamp | sí | UTC. |

**Índices**:
- PK en `id`.
- Único (`tenantId`, `LOWER(sku)`).
- Índice en (`tenantId`, `category`).
- Índice en (`tenantId`, `active`).

**Reglas de integridad**:
- No se **debe** poder eliminar un producto con movimientos registrados. En su lugar se marca `active = false`.
- `price > 0`, `cost >= 0`, `minStock >= 0`.

**Stock derivado**:
El stock **no** se almacena en Product. Se calcula:

```sql
stock(product_id) =
    COALESCE(SUM(CASE WHEN type IN ('in','adjust_pos') THEN quantity ELSE -quantity END), 0)
    FROM movement
    WHERE product_id = :id
```

Para rendimiento, se **debería** mantener una tabla materializada `product_balance(product_id, stock)` actualizada por trigger al insertar un movement.

---

## Entidad: Movement (movimiento de inventario)

Registra un cambio en el stock. **Inmutable**: no se edita ni se elimina.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|------|-------------|
| `id` | UUID | sí | Identificador único. |
| `tenantId` | UUID | sí | FK → Tenant. Redundante pero útil para particionado. |
| `productId` | UUID | sí | FK → Product. |
| `type` | enum | sí | `in` / `out` / `adjust_pos` / `adjust_neg`. |
| `quantity` | decimal(14,4) | sí | Siempre > 0. El signo se infiere del tipo. |
| `unitCost` | decimal(14,4) | no | Costo unitario real de esta compra. Solo se diligencia en entradas (`in`). Usado para cálculo WAC. |
| `unitPrice` | decimal(14,4) | no | Precio de venta unitario real. Solo se diligencia en salidas tipo Venta (`out`). Usado para ingresos reales. |
| `reason` | string(80) | sí | Motivo legible (ver RF-MV-014). |
| `reference` | string(80) | no | Referencia externa (factura, número de venta, ej: `FAC-001`, `VTA-0032`). |
| `createdAt` | timestamp | sí | Fecha/hora exacta del movimiento en UTC. |
| `createdByUserId` | UUID | sí | FK → User. Quién lo registró. |

**Índices**:
- PK en `id`.
- Índice en (`productId`, `createdAt DESC`) — crítico para cálculo de stock, historial, WAC.
- Índice en (`tenantId`, `createdAt DESC`) — para vista global de movimientos.
- Índice en (`tenantId`, `type`, `createdAt DESC`) — para filtros.

**Reglas de integridad**:
- `quantity > 0` siempre.
- `type ∈ {in, out, adjust_pos, adjust_neg}`.
- Un movimiento **no se puede** actualizar ni eliminar. La BD **debe** tenerlo inmutable por defecto (triggers que lo impidan, o revocar privilegios UPDATE/DELETE al rol de aplicación).
- La validación de stock suficiente se hace al momento de crear la salida, no se impone con constraints.

**Notas sobre `unitCost` y `unitPrice`**:
- En una entrada, `unitCost` captura el costo real de esa compra específica. Puede variar entre compras del mismo producto.
- En una salida tipo "Venta", `unitPrice` captura el precio real al que se vendió (puede haber descuento, promo, ajuste).
- Si no se diligencia, los cálculos caen al costo/precio del catálogo (ver `costOf()` / `priceOf()` en documento 04).

---

## Entidad opcional: Audit log (v1.1)

Para cumplir con RNF-AU, se **debería** mantener un log auditable de acciones administrativas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK. |
| `tenantId` | UUID | FK. |
| `userId` | UUID | Usuario que hizo la acción. |
| `action` | string(80) | `product.create`, `product.update`, `settings.update`, `movement.create`, etc. |
| `targetType` | string(40) | Tipo de entidad (product, movement, settings). |
| `targetId` | UUID | ID de la entidad afectada. |
| `before` | jsonb | Estado antes (null si create). |
| `after` | jsonb | Estado después (null si delete). |
| `ipAddress` | string(45) | IPv4 o IPv6. |
| `createdAt` | timestamp | UTC. |

---

## Enumeraciones

### `movement_type`

| Valor | Significado | Afecta stock |
|-------|------------|-------------|
| `in` | Entrada (compra, producción, devolución cliente) | +qty |
| `out` | Salida (venta, consumo, merma, devolución proveedor) | −qty |
| `adjust_pos` | Ajuste positivo por conteo físico | +qty |
| `adjust_neg` | Ajuste negativo por conteo físico | −qty |

### `valuation_method`

| Valor | Significado |
|-------|------------|
| `avg` | Promedio ponderado (WAC), default. |
| `fifo` | First In, First Out. En MVP se trata como WAC; en v2 se implementa real. |
| `last` | Último costo (el de la compra más reciente). |

### `vertical`

| Valor | Descripción |
|-------|------------|
| `retail` | Tienda / minimarket / abarrotes. |
| `bakery` | Panadería / repostería. |
| `hardware` | Ferretería. |
| `pharmacy` | Farmacia / droguería. |
| `petshop` | Tienda de mascotas. |
| `other` | Negocio personalizado (requiere `customVerticalName`). |

### `user_role`

| Valor | MVP | Descripción |
|-------|-----|-------------|
| `admin` | sí | Acceso total al tenant. |
| `operator` | no (v2) | Puede registrar movimientos y ver reportes, no cambiar configuración. |
| `viewer` | no (v2) | Solo lectura. |

---

## Persistencia en el prototipo (referencia)

En el prototipo HTML, las entidades se guardan en `localStorage` con las siguientes keys:

| Entidad | Key |
|---------|-----|
| Tenant | `inventra.demo.tenant` |
| User | `inventra.demo.user` |
| Branches | `inventra.demo.branches` (array) |
| Settings | `inventra.demo.settings` |
| Products | `inventra.demo.products` (array) |
| Movements | `inventra.demo.movements` (array) |

Esta persistencia es **solo para demo**. La versión real **no debe** usar localStorage como fuente de verdad; **debe** usar backend + base de datos.

---

## Consideraciones de migración

Si se importan datos desde otro sistema:

1. **Catálogo de productos**: mapear a Product. Stock inicial se registra como movimiento tipo `in` con motivo "Saldo inicial".
2. **Histórico de compras**: cada compra es un movimiento `in` con su `unitCost` del período.
3. **Histórico de ventas**: cada venta es un movimiento `out` con su `unitPrice` del período.
4. **No se importan stocks directos**: se reconstruyen desde los movimientos.

El servicio de importación **debe** validar:
- SKUs únicos por tenant.
- Fechas consistentes (no en el futuro).
- Cantidades positivas.
- Coherencia entre stock final importado y suma de movimientos.
