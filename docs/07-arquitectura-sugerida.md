# 07 · Arquitectura sugerida

Este documento propone una arquitectura para la implementación real. Las decisiones de stack específico son **recomendaciones** basadas en el contexto del proyecto (Angular 21 ya elegido para frontend, orientación multiagente). El equipo puede proponer alternativas que cumplan con los requisitos de los documentos 01 y 02.

---

## Visión general

```
┌─────────────────────────────────────────────┐
│              Frontend (Angular 21)          │
│   SPA modular con signals + standalone      │
└───────────────────┬─────────────────────────┘
                    │  HTTPS (REST/JSON)
┌───────────────────┴─────────────────────────┐
│              API Gateway                    │
│      Auth, rate limit, logging, CORS        │
└───────────────────┬─────────────────────────┘
                    │
   ┌────────────────┼──────────────┬─────────────────┐
   │                │              │                 │
┌──────┐        ┌──────┐       ┌──────┐         ┌─────────┐
│ Core │        │ Ana- │       │ Chat │         │ Ingest  │
│ svc  │        │ lytics│      │ agent│         │ / Batch │
└──┬───┘        └──┬───┘       └──┬───┘         └────┬────┘
   │               │              │                  │
   └───────┬───────┴──────┬───────┴──────────────────┘
           │              │
       ┌────────┐     ┌────────┐
       │ Postgres│     │ Redis  │
       └────────┘     └────────┘
```

### Capas

1. **Frontend**: Angular 21 SPA, standalone components, signals para estado reactivo, zoneless opcional.
2. **API Gateway**: autenticación, autorización, rate limiting, logging uniforme, CORS. Puede ser Nginx + middleware, o un API Gateway managed (Kong, AWS API Gateway, Azure API Management).
3. **Servicios backend**: arquitectura multiagente (ver abajo).
4. **Persistencia**: PostgreSQL como fuente de verdad, Redis para cache y cola de eventos.

---

## Frontend — Angular 21

### Estructura de carpetas sugerida

```
src/
  app/
    core/                     # singletons (auth, http interceptors, api clients)
      auth/
      http/
      config/
    shared/                   # componentes, pipes, directivas reutilizables
      components/
        button/
        badge/
        toast/
        insight-card/
        summary-card/
        health-gauge/
        data-table/
      pipes/
        money.pipe.ts
        date-local.pipe.ts
      directives/
    features/                 # un folder por feature/módulo
      dashboard/
      products/
      movements/
      reports/
      insights/
      chat/
      settings/
      onboarding/
        steps/
    domain/                   # modelo de dominio (tipos, interfaces)
      product.model.ts
      movement.model.ts
      tenant.model.ts
      valuation.ts            # funciones puras de cálculo (WAC, WAC, ABC)
      forecasting.ts
      insights.ts
    app.routes.ts
    app.config.ts
  assets/
  styles/
    tokens.css                # design tokens
    globals.css
```

### Principios

- **Standalone components** (sin `NgModule` excepto donde absolutamente necesario).
- **Signals** para estado local y derivado; `computed()` para cálculos reactivos (margen, cobertura, salud).
- **Zoneless change detection** si el equipo tiene experiencia; de lo contrario, default con OnPush.
- **Funciones de dominio puras** (ej: `marginPct`, `suggestReorder`, `abcClassification`) viven en `src/app/domain/` y son testeables sin Angular. Son 1:1 con las fórmulas del documento 04.
- **Feature modules** encapsulan sus rutas, servicios y componentes. Lazy load por ruta.
- **HTTP interceptors** para: inyectar token, manejar 401 (refresh), logging, retry idempotente.

### Estado global

Evitar librerías pesadas de estado (NgRx) a menos que la complejidad lo justifique. Alternativas:

- **Signals-based services**: cada feature expone un service con signals (`products`, `selectedProduct`, `filters`). Los componentes consumen y mutan vía métodos del service.
- **Persistencia de filtros**: en URL (querystring) para reportes, via `Router.navigate` con `queryParams`.

### Patrones recomendados

- **Formularios**: Reactive Forms con `FormBuilder`. Validaciones custom en `src/app/core/validators/`.
- **Validación de stock en vivo**: subscribe a valueChanges del producto y cantidad, emite error si `qty > stockOf(product)`.
- **Internacionalización**: `@angular/localize` con messages Colombia como default. Estructurar para soportar i18n en v2.
- **Accesibilidad**: usar CDK de Angular Material para modales, dropdowns, listas.

---

## Backend — arquitectura multiagente

La orientación "multiagente" del proyecto sugiere especialización por dominio de responsabilidad. Propuesta:

### Servicio `Core` (o `Inventory Service`)

**Responsabilidad**: operaciones CRUD sobre catálogo, movimientos, tenants, usuarios. Es el servicio transaccional.

**Endpoints clave**:
- `POST /tenants` (onboarding).
- `GET/POST/PATCH /products`.
- `GET/POST /movements` (create es el único write; read para historial).
- `GET /products/:id/stock` (devuelve saldo pre-calculado).
- `GET/PATCH /settings`.

**Persistencia**: PostgreSQL (tabla por entidad del documento 03).

**Validaciones críticas**:
- Stock no negativo (vs `settings.allowNegativeStock`).
- SKU único por tenant.
- Movimiento inmutable (rechazar UPDATE/DELETE en BD).

### Servicio `Analytics`

**Responsabilidad**: cálculos de negocio que pueden ser costosos o beneficiarse de cache: WAC dinámico, ABC clasificación, pronóstico, health score, insights.

**Endpoints**:
- `GET /analytics/products/:id/cost` — costo efectivo según método de valoración.
- `GET /analytics/products/:id/forecast` — sugerencia de reorden.
- `GET /analytics/abc?days=30` — clasificación ABC del tenant.
- `GET /analytics/health` — health score + componentes.
- `GET /analytics/insights` — lista de insights generados.
- `GET /analytics/reports/:type?filters` — agregados para cada tab de reportes.

**Cache**: Redis con TTL corto (ej. 60s) por tenant para los agregados más usados. Invalidación por evento cuando se crea un movimiento.

**Consideración**: en el MVP, los cálculos se pueden hacer on-demand. Si se detecta carga alta, pasar a materialización asincrónica (jobs que actualizan tablas de agregados cuando llega un movimiento).

### Servicio `Chat Agent`

**Responsabilidad**: interpretar preguntas en lenguaje natural y responder consultando al servicio Analytics.

**Opciones de implementación**:

#### Opción A · Regex + templates (MVP)
- Misma lógica que el prototipo (reglas del documento 04, sección RN-CH).
- Rápido, determinístico, sin dependencias externas.
- Suficiente para las 14 intenciones del MVP.
- Coste: $0 por query.

#### Opción B · LLM con function calling (v2)
- Usar Claude o similar con tool calling.
- Las "tools" expuestas son los endpoints de Analytics.
- Permite preguntas menos estructuradas ("oye cómo vamos en la plata este mes comparado con el anterior").
- Requiere rate limiting y monitoreo de costos.
- Coste: variable, requiere presupuesto operativo.

**Recomendación MVP**: empezar con Opción A, dejar la arquitectura preparada para B (el Chat Agent expone la misma API `POST /chat` que el frontend consume; el switch es interno).

### Servicio `Ingest` / `Batch` (v1.1)

**Responsabilidad**: importación masiva de catálogo o movimientos desde Excel/CSV.

**Endpoints**:
- `POST /imports/products` (sube archivo, retorna job ID).
- `GET /imports/:jobId/status`.

**Implementación**: job queue (Redis-backed: BullMQ, o similar). Procesa en lotes, valida, reporta errores por línea.

---

## Stack recomendado

| Capa | Tecnología recomendada | Alternativas |
|------|----------------------|--------------|
| Frontend | Angular 21 + TypeScript 5.6 | (ya definido) |
| Build frontend | Vite o esbuild (nativo Angular 21) | Webpack (legacy) |
| Backend runtime | Node.js 22 LTS con TypeScript | Python (FastAPI), Go, Java (Spring) |
| Framework backend | NestJS | Express puro, Fastify, Hono |
| DB relacional | PostgreSQL 16+ | MySQL 8 (segunda opción) |
| Cache / queue | Redis 7 | (no reemplazar) |
| ORM | Prisma o Drizzle | TypeORM |
| Autenticación | JWT + refresh tokens. Opcional: Auth0/Clerk/Cognito para SSO. | Cookies de sesión con CSRF tokens |
| Container | Docker + Docker Compose local | — |
| Orquestación | Kubernetes o ECS para producción | — |
| CI/CD | GitHub Actions | GitLab CI, CircleCI |
| Monitoring | Datadog, New Relic, o Grafana+Prometheus | — |
| Logging | Structured logs (JSON) + agregación | — |
| Error tracking | Sentry | — |

---

## Decisiones técnicas clave

### D-001 · Stock derivado + cache pre-calculado

**Decisión**: el stock es formalmente la suma de movimientos, pero para performance se mantiene una tabla `product_balance` pre-calculada.

**Mecanismo**:
- Trigger en `INSERT` de `movement` que actualiza `product_balance`.
- Validaciones de stock suficiente leen del balance cacheado.
- Una vez al día, un job de reconciliación recalcula todos los balances y alerta si hay discrepancia (debería ser imposible, pero da visibilidad).

**Alternativa considerada y descartada**: SUM() en cada consulta. Funciona hasta ~100K movimientos, falla en producción. Caching con Redis es posible pero añade complejidad; usar la BD es más simple.

### D-002 · Valuación calculada, no almacenada

**Decisión**: el costo efectivo (WAC, FIFO, Last) se calcula a demanda.

**Razonamiento**: el método puede cambiar; la historia de movimientos es la verdad.

**Rendimiento**: con índice en `(product_id, created_at)` y filtrado por `unit_cost > 0`, el cálculo es sub-100ms incluso con 1.000 entradas por producto. Si se vuelve un cuello de botella: cachear en Redis con invalidación por evento.

### D-003 · Multi-tenant por row-level

**Decisión**: toda tabla tiene `tenant_id`. Las queries **deben** incluirlo siempre (reforzado por middleware o RLS de PostgreSQL).

**Alternativa descartada**: una BD por tenant. Agrega complejidad operativa injustificada para los volúmenes del MVP.

### D-004 · Movimientos inmutables a nivel de BD

**Decisión**: revocar `UPDATE` y `DELETE` a nivel de BD para la tabla `movement`. La única forma de modificar es vía un `INSERT` de compensación.

**Razonamiento**: RN-ST-003 y cumplimiento fiscal. Incluso bugs del backend no pueden corromper la historia.

### D-005 · Zonas horarias

**Decisión**: almacenar todo en UTC. Formatear en la TZ del tenant para display (frontend o backend, consistente).

**En reportes**: los filtros de fecha se interpretan en la TZ del tenant (ej. "hoy" en Bogotá es 00:00 a 23:59 UTC-5).

### D-006 · Configuración cambiable sin migración

**Decisión**: cambiar `valuationMethod` no requiere migración de datos. La próxima consulta recalcula con el nuevo método.

**Razonamiento**: los movimientos ya tienen `unitCost`; el método es solo la forma de agregar. No hay datos "costeados" congelados.

---

## Seguridad

- **Autenticación**: JWT con refresh token. Access token corto (15 min), refresh 7 días, rotación en cada uso.
- **Autorización**: middleware que verifica `tenant_id` del token vs el recurso solicitado. Rechazar cross-tenant con 403.
- **Row-Level Security (PostgreSQL)**: como defensa en profundidad, habilitar RLS en tablas sensibles con política `tenant_id = current_setting('app.tenant_id')`.
- **Passwords**: argon2id (preferido) o bcrypt cost ≥ 12.
- **Rate limiting**: 100 requests/min por usuario, 10/min para login.
- **OWASP Top 10**: auditar en cada release (npm audit, Snyk).

---

## Migraciones y evolución

- **Zero-downtime deploys**: migraciones backward-compatible. Agregar columnas como nullable primero, desplegar código que las lee, luego backfill, luego constraint.
- **Feature flags**: para funcionalidades en v1.1 que se quieran desplegar gradualmente (ej. lote/vencimiento para farmacia).
- **Versionado de API**: `/v1/...`. Cambios incompatibles → `/v2/...`.

---

## Roadmap sugerido post-MVP

| Versión | Funcionalidad | Prioridad |
|---------|---------------|-----------|
| v1.0 | Todo lo descrito en RF-*, un tenant, un usuario, una sucursal. | MVP |
| v1.1 | Importación masiva (Excel/CSV). Dashboard con más stat cards configurables. | Alta |
| v1.2 | Multi-usuario con roles (admin, operator, viewer). Auditoría completa. | Alta |
| v1.3 | Múltiples sucursales con transferencias y stock por ubicación. | Media |
| v1.4 | Lote y fecha de vencimiento (crítico para farmacia). | Media — alta para pharmacy |
| v2.0 | Gestión de proveedores, órdenes de compra, recepción vs orden. | Media |
| v2.1 | Chat con LLM real (function calling). | Baja — experimento |
| v2.2 | App móvil nativa o PWA con offline robusto. | Media |
| v2.3 | Integración con facturación electrónica (DIAN Colombia). | Alta para Colombia |
| v2.4 | Notificaciones (email, WhatsApp, push) para alertas y pronóstico. | Media |
| v3.0 | Multi-moneda por movimiento (ahora es solo por tenant). Tasa de cambio. | Baja |

---

## Infraestructura de desarrollo

- **Local**: `docker-compose up` levanta PostgreSQL + Redis + backend. Frontend corre con `ng serve` apuntando al backend local.
- **Seeds de BD**: script SQL que carga el demo (empresa + 13 productos + 60 movimientos) en segundos.
- **Migraciones**: Prisma migrate o Drizzle kit.
- **Tests**:
  - Unit: funciones de dominio (cobertura ≥ 80%).
  - Integration: endpoints con BD real (docker).
  - E2E: Playwright para flujos críticos (onboarding, registrar venta, revisar reporte).
- **Linting y formatting**: ESLint + Prettier en backend, Angular ESLint + Prettier en frontend.
- **Pre-commit**: husky + lint-staged.

---

## Escenarios de escalamiento

### Tenant pequeño (100 productos, 50 movimientos/día)

- PostgreSQL single-instance con instancias db.t3.medium (AWS) o equivalente.
- Sin cache distribuido necesario.
- Backend single-container con 0.5 vCPU + 512 MB RAM.

### Tenant mediano (1.000 productos, 500 mov/día)

- BD en instancia dedicada, conexiones pooled (PgBouncer).
- Redis para cache de agregados por tenant.
- Backend con 2 replicas detrás de load balancer.
- Sub-100ms de latencia p95 en endpoints principales.

### Tenant grande (10.000 productos, 5.000 mov/día)

- BD con read replicas para reportes.
- Cache agresivo de agregados (expira por evento).
- Backend autoscaled por demanda.
- Jobs asincrónicos para reportes pesados (con notificación al usuario cuando terminen).

### Plataforma (10.000 tenants)

- Particionado de `movement` por `tenant_id` (hash partitioning).
- BD replicada geográficamente.
- CDN para frontend.
- Separación de workloads OLTP (Core) y OLAP (Analytics) posiblemente con Citus o un data warehouse.
