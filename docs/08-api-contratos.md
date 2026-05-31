# 08 · API y contratos

Contratos REST sugeridos para el backend. Los payloads son `application/json` UTF-8. Las fechas son ISO 8601 UTC. Los montos son decimales con hasta 4 posiciones.

**Base URL**: `https://api.inventra.ai/v1`

---

## Convenciones

### Autenticación

Todos los endpoints (excepto `/auth/*` y `/health`) requieren header:

```
Authorization: Bearer <access_token>
```

El token contiene `sub` (user_id) y `tid` (tenant_id). El middleware valida y adjunta `tenantId` al contexto de la request.

### Formato de respuesta

**Éxito**:
```json
{
  "data": { ... } | [ ... ],
  "meta": { "page": 1, "pageSize": 50, "total": 120 }
}
```

**Error**:
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para «Arroz». Disponible: 5 Unidad, solicitado: 10 Unidad.",
    "details": { "productId": "...", "available": 5, "requested": 10 }
  }
}
```

### Códigos HTTP

| Código | Uso |
|--------|-----|
| 200 | OK — respuesta con data. |
| 201 | Created — recurso creado (POST exitoso). |
| 204 | No Content — operación ok sin body. |
| 400 | Bad Request — payload inválido. |
| 401 | Unauthorized — token ausente o inválido. |
| 403 | Forbidden — token válido pero sin permisos (cross-tenant, rol insuficiente). |
| 404 | Not Found. |
| 409 | Conflict — SKU duplicado, integridad. |
| 422 | Unprocessable Entity — validación de negocio (stock insuficiente). |
| 429 | Too Many Requests — rate limit. |
| 500 | Internal Server Error. |

### Códigos de error de negocio

| Código | Significado |
|--------|-------------|
| `VALIDATION_ERROR` | Validación de campos falló. Detalles en `details.fields`. |
| `DUPLICATE_SKU` | Ya existe un producto con ese SKU en el tenant. |
| `INSUFFICIENT_STOCK` | Salida rechazada por stock insuficiente. |
| `PRODUCT_HAS_MOVEMENTS` | No se puede eliminar; desactivar en su lugar. |
| `IMMUTABLE_MOVEMENT` | Se intentó modificar o eliminar un movimiento. |
| `CROSS_TENANT_ACCESS` | El recurso no pertenece al tenant del token. |
| `INVALID_VALUATION_METHOD` | Método de valoración no soportado. |
| `ONBOARDING_ALREADY_COMPLETE` | El tenant ya está creado. |

---

## Autenticación

### POST /auth/signup (onboarding completo)

Crea tenant + usuario admin + configuración inicial + catálogo semilla.

**Request**:
```json
{
  "tenant": {
    "name": "Tienda Don Pepe",
    "taxId": "900123456",
    "vertical": "retail",
    "customVerticalName": null,
    "country": "COL",
    "currency": "COP",
    "timezone": "America/Bogota",
    "email": "pepe@example.com",
    "phone": "+573001234567"
  },
  "admin": {
    "name": "José Pérez",
    "email": "pepe@example.com",
    "password": "********"
  },
  "branch": {
    "name": "Sucursal Principal",
    "address": "Calle 10 #5-20",
    "warehouse": "Bodega Central"
  },
  "settings": {
    "valuationMethod": "avg",
    "allowNegativeStock": false,
    "defaultMinStock": 5,
    "adjustThreshold": 500
  },
  "initialProducts": [
    {
      "sku": "ARR-001",
      "name": "Arroz 1kg",
      "category": "Abarrotes",
      "unit": "Kg",
      "minStock": 20,
      "cost": 2000,
      "price": 2500,
      "currentStock": 60
    }
  ]
}
```

**Response 201**:
```json
{
  "data": {
    "tenantId": "uuid",
    "userId": "uuid",
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "expiresIn": 900
  }
}
```

Por cada producto con `currentStock > 0`, el servicio genera automáticamente un movimiento `in` con motivo "Saldo inicial" y `unitCost = cost`.

### POST /auth/login

**Request**:
```json
{ "email": "pepe@example.com", "password": "********" }
```

**Response 200**:
```json
{
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "José Pérez",
      "role": "admin"
    }
  }
}
```

### POST /auth/refresh

Rota el refresh token y emite un nuevo access token.

### POST /auth/logout

Invalida el refresh token actual.

---

## Productos

### GET /products

Lista productos del tenant.

**Query params**:
- `search` (string) — búsqueda libre en nombre/SKU/categoría.
- `category` (string) — filtro por categoría.
- `status` (enum) — `all` (default), `belowMin`, `aboveMin`, `outOfStock`.
- `active` (bool) — true (default) / false.
- `page` (int, default 1), `pageSize` (int, default 50, max 200).

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "sku": "ARR-001",
      "name": "Arroz 1kg",
      "category": "Abarrotes",
      "unit": "Kg",
      "minStock": 20,
      "cost": 2000,
      "price": 2500,
      "active": true,
      "stock": 45,
      "costEffective": 2443,
      "marginPct": 2.3,
      "createdAt": "2026-03-01T12:00:00Z",
      "updatedAt": "2026-04-10T09:20:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "total": 120 }
}
```

Nota: `stock` y `costEffective` son campos calculados por el backend (no se escriben nunca).

### POST /products

Crea un producto.

**Request**:
```json
{
  "sku": "PRO-014",
  "name": "Café Premium 500g",
  "category": "Abarrotes",
  "unit": "Unidad",
  "minStock": 10,
  "cost": 12000,
  "price": 18000,
  "initialStock": 20
}
```

**Response 201**:
```json
{
  "data": { "id": "uuid", "...": "..." }
}
```

Si `initialStock > 0`, se genera también un movimiento `in` con `reason = "Stock inicial"`.

**Errores**:
- `409 DUPLICATE_SKU` si el SKU ya existe en el tenant.

### GET /products/:id

Detalle de un producto con stock calculado.

### PATCH /products/:id

Edición parcial. Campos editables: `name`, `category`, `unit`, `minStock`, `cost`, `price`, `active`. **No editable**: `sku` (considerado inmutable una vez creado — si se quiere permitir, marcarlo explícitamente).

### DELETE /products/:id

Elimina un producto **solo si no tiene movimientos**. De lo contrario, retorna `409 PRODUCT_HAS_MOVEMENTS` y sugiere `PATCH { active: false }`.

### GET /products/:id/stock

**Response 200**:
```json
{
  "data": {
    "productId": "uuid",
    "stock": 45,
    "unit": "Kg"
  }
}
```

### GET /products/:id/cost

Retorna el costo efectivo calculado según método de valoración vigente.

```json
{
  "data": {
    "productId": "uuid",
    "method": "avg",
    "cost": 2443,
    "breakdown": { "totalQty": 70, "totalValue": 171000 }
  }
}
```

---

## Movimientos

### POST /movements

Registra un movimiento (entrada, salida o ajuste).

**Request (entrada)**:
```json
{
  "productId": "uuid",
  "type": "in",
  "quantity": 30,
  "unitCost": 2500,
  "reason": "Compra",
  "reference": "FAC-1011"
}
```

**Request (salida tipo venta)**:
```json
{
  "productId": "uuid",
  "type": "out",
  "quantity": 3,
  "unitPrice": 3400,
  "reason": "Venta",
  "reference": "VTA-0032"
}
```

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "type": "in",
    "quantity": 30,
    "unitCost": 2500,
    "reason": "Compra",
    "reference": "FAC-1011",
    "createdAt": "2026-04-19T10:30:00Z",
    "createdByUserId": "uuid",
    "productStock": 75
  }
}
```

`productStock` es el nuevo stock del producto tras aplicar el movimiento (conveniencia para el cliente, evita una request adicional).

**Errores**:
- `422 INSUFFICIENT_STOCK` si salida deja stock negativo y no está permitido.
- `400 VALIDATION_ERROR` si `quantity <= 0` o campos faltan.

### GET /movements

**Query params**:
- `productId` (uuid).
- `type` (enum): `in`, `out`, `adjust_pos`, `adjust_neg`, `incoming` (in + adjust_pos), `outgoing` (out + adjust_neg).
- `from`, `to` (ISO dates).
- `page`, `pageSize`.

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productSku": "ARR-001",
      "productName": "Arroz 1kg",
      "type": "in",
      "quantity": 30,
      "unitCost": 2500,
      "unitPrice": null,
      "reason": "Compra",
      "reference": "FAC-1011",
      "runningBalance": 75,
      "createdAt": "2026-04-19T10:30:00Z",
      "createdByUserId": "uuid",
      "createdByName": "José Pérez"
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "total": 1234 }
}
```

`runningBalance` es el stock acumulado del producto justo después de ese movimiento.

### GET /movements/:id

Detalle de un movimiento (para trazabilidad).

**Nota**: no hay `PATCH` ni `DELETE`. Los movimientos son inmutables.

---

## Alertas

### GET /alerts

Productos con stock bajo mínimo.

**Response 200**:
```json
{
  "data": [
    {
      "productId": "uuid",
      "sku": "PAN-005",
      "name": "Pan tajado Bimbo",
      "stock": 2,
      "minStock": 10,
      "missing": 8,
      "daysOfCoverage": 0.5
    }
  ],
  "meta": { "total": 7 }
}
```

Ordenado por `missing` descendente (más crítico primero).

---

## Reportes

### GET /reports/inventory

Tab 1 (Inventario actual).

**Query params**: `from`, `to`, `productId`, `category`.

**Response 200**:
```json
{
  "data": {
    "totalProducts": 120,
    "totalUnits": 3456,
    "totalValue": 12450000,
    "totalInValue": 2300000,
    "totalOutValue": 1800000,
    "rows": [
      {
        "productId": "uuid",
        "sku": "ARR-001",
        "name": "Arroz 1kg",
        "category": "Abarrotes",
        "unit": "Kg",
        "stock": 45,
        "minStock": 20,
        "in": 30,
        "out": 15,
        "costEffective": 2443,
        "price": 2500,
        "marginPct": 2.3,
        "value": 112500,
        "status": "ok"
      }
    ]
  }
}
```

### GET /reports/profitability

Tab 5 (Rentabilidad).

**Query params**: `from`, `to`, `productId`, `category`.

**Response 200**:
```json
{
  "data": {
    "totals": {
      "revenue": 12450000,
      "cogs": 7800000,
      "profit": 4650000,
      "marginPct": 37.3,
      "productsWithoutCost": 3
    },
    "valuationMethod": "avg",
    "rows": [
      {
        "productId": "uuid",
        "name": "...",
        "qty": 15,
        "avgSalePrice": 3400,
        "listPrice": 3500,
        "priceDiffPct": -2.9,
        "revenue": 51000,
        "cogs": 30000,
        "profit": 21000,
        "marginPct": 41.2,
        "hasCost": true
      }
    ]
  }
}
```

### GET /reports/forecast

Tab 6 (Pronóstico).

**Response 200**:
```json
{
  "data": [
    {
      "productId": "uuid",
      "name": "Pan tajado Bimbo",
      "stock": 4,
      "avgDaily": 1.3,
      "daysLeft": 3,
      "qtySuggested": 35,
      "reorderByDate": null,
      "urgent": true,
      "priority": "urgent"
    }
  ]
}
```

### GET /reports/by-category

Tab 3.

### GET /reports/top-products

Tab 4. Query param `limit` (default 20).

### GET /reports/movements

Tab 2 (es equivalente a `/movements` pero formateado para tabla de reporte, con unitPrice/unitCost y totales).

### GET /reports/:type/export.csv

Exporta el tab como CSV. Headers:
- `Content-Type: text/csv; charset=utf-8`.
- `Content-Disposition: attachment; filename="inventra-<type>-2026-04-19.csv"`.

Formato:
- Separador `;`.
- BOM UTF-8 al inicio.
- Fechas ISO 8601.
- Montos sin separador de miles.

---

## Analytics / Inteligencia

### GET /analytics/health

**Response 200**:
```json
{
  "data": {
    "score": 73,
    "label": "Bueno",
    "components": {
      "stock": 85,
      "rotation": 70,
      "dead": 65,
      "margin": 60
    }
  }
}
```

### GET /analytics/insights

**Response 200**:
```json
{
  "data": [
    {
      "level": "danger",
      "icon": "🚨",
      "title": "3 productos requieren reposición urgente",
      "message": "Cobertura menor a 3 días o sin stock con ventas recientes.",
      "products": [
        { "id": "uuid", "name": "Pan tajado Bimbo", "sku": "PAN-005" }
      ]
    }
  ]
}
```

### GET /analytics/abc

**Query params**: `days` (default 30).

**Response 200**:
```json
{
  "data": {
    "days": 30,
    "counts": { "A": 4, "B": 8, "C": 20, "Z": 5 },
    "byProduct": [
      { "productId": "uuid", "name": "...", "class": "A", "revenue": 1200000 }
    ]
  }
}
```

### GET /analytics/summary

Datos para la vista de Inteligencia (todo lo que alimenta las 4 summary cards + mood).

**Response 200**:
```json
{
  "data": {
    "mood": {
      "level": "warning",
      "icon": "🟡",
      "title": "Algunos puntos de atención",
      "message": "Hay 3 producto(s) que conviene revisar pronto."
    },
    "weekRevenue": {
      "amount": 1240000,
      "units": 34,
      "topSellers": [
        { "productId": "uuid", "name": "Arroz", "revenue": 450000 }
      ]
    },
    "alerts": {
      "count": 2,
      "top": [
        { "productId": "uuid", "name": "Pan", "stock": 2, "minStock": 10 }
      ]
    },
    "toReorder": {
      "count": 4,
      "top": [
        { "productId": "uuid", "name": "Pan", "daysLeft": 3 }
      ]
    },
    "dead": {
      "count": 3,
      "top": [
        { "productId": "uuid", "name": "Olla arrocera", "daysSince": 45 }
      ]
    }
  }
}
```

---

## Chat NLP

### POST /chat

**Request**:
```json
{
  "message": "que tengo que pedir esta semana",
  "sessionId": "uuid-opt"
}
```

**Response 200**:
```json
{
  "data": {
    "sessionId": "uuid",
    "reply": {
      "text": "📋 Productos a reponer:\n• Pan — pedir 35 Unidad (quedan 3 días)\n• Galletas — pedir 20 (🚨 pedir ya)",
      "intent": "reorder",
      "products": [
        { "id": "uuid", "name": "Pan", "sku": "PAN-005" },
        { "id": "uuid", "name": "Galletas", "sku": "GAL-009" }
      ]
    }
  }
}
```

El backend devuelve también los productos referenciados para que la UI pueda hacer links clickeables.

---

## Configuración

### GET /settings

Devuelve el settings del tenant.

### PATCH /settings

Actualiza parcialmente.

**Request**:
```json
{
  "valuationMethod": "last",
  "allowNegativeStock": false
}
```

---

## Importación (v1.1)

### POST /imports/products

Sube un CSV o Excel con productos.

**Request**: `multipart/form-data` con campo `file`.

**Response 202**:
```json
{
  "data": {
    "jobId": "uuid",
    "status": "processing",
    "statusUrl": "/imports/uuid/status"
  }
}
```

### GET /imports/:jobId/status

**Response 200**:
```json
{
  "data": {
    "jobId": "uuid",
    "status": "completed",
    "total": 150,
    "success": 148,
    "failed": 2,
    "errors": [
      { "row": 23, "message": "SKU duplicado: ARR-001" }
    ]
  }
}
```

---

## Health check

### GET /health

Sin autenticación.

**Response 200**:
```json
{
  "status": "ok",
  "version": "1.0.3",
  "uptime": 123456,
  "database": "ok",
  "cache": "ok"
}
```

---

## Rate limiting

Headers en cada response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1713546400
```

Si se excede: `429 Too Many Requests` con `Retry-After: 30`.

Defaults:
- Usuario autenticado: 100 req/min general, 20 req/min en POST.
- Sin auth (login, signup): 10 req/min por IP.

---

## Versionado

Todas las URLs bajo `/v1/`. Para `v2`:
- Endpoints incompatibles → `/v2/...`.
- Mantener `/v1/` activo al menos 6 meses después del lanzamiento de `/v2/`.
- Avisar deprecation con header `Sunset: Wed, 11 Nov 2026 00:00:00 GMT`.
