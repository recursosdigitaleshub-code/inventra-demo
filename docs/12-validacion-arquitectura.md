# 12 · Validación de arquitectura y recomendaciones (revisión senior)

> Revisión técnica del stack realizada con fuentes oficiales (Angular, Firebase) y comparativas de la industria. Fecha: 2026-05-30.

Este documento valida las decisiones de stack de [11-stack-y-arquitectura](11-stack-y-arquitectura.md) contra fuentes confiables y propone la arquitectura objetivo recomendada.

---

## 1. Validación del stack actual

### 1.1 Angular 21 — ✅ Versión válida y vigente

Confirmado contra la documentación oficial: **Angular v21 es la versión estable actual**. El `package.json` (`^21.0.0`) apunta a una versión real y soportada (Angular da soporte ~18 meses por release mayor).

Hallazgos oficiales relevantes (angular.dev):

| Práctica | Estado en v21 | Implicación para Inventra |
|----------|---------------|---------------------------|
| **Standalone components** | Default desde v17 | ✅ El esqueleto `src/` ya los usa — correcto |
| **Signals** (`signal`, `effect`, `linkedSignal`) | Estables desde v20 | ✅ Usar señales como primitiva de estado (no NgModules ni stores externos pesados) |
| **Zoneless change detection** | Estable desde v20.2 | ⚠️ El `package.json` aún incluye `zone.js`; conviene migrar a zoneless |
| **`resource()` / `httpResource()`** | Experimental, en promoción | Usar para cargar datos asíncronos (reemplaza patrones RxJS verbosos) |
| **Signal Forms** | Experimental en v21 | Evaluar para formularios (onboarding, producto) |
| **SSR + hydration incremental** | Estable desde v20 | Mejora 40-50% en LCP; opcional para una app interna |
| **Vitest** | Test runner por defecto en v21 | ✅ Adoptar Vitest (no Karma) para pruebas |

**Recomendación senior:** la dirección del esqueleto `src/` es correcta. Para alinearlo con v21: usar **signals como estado primario**, habilitar **zoneless**, y **Vitest** para tests. Evitar introducir NgRx/librerías de estado pesadas — con señales + un store de servicio basta para este dominio.

### 1.2 Prototipo vanilla — ✅ Adecuado a su propósito

El single-file HTML/JS/localStorage es la elección **correcta para una demo comercial**: cero build, cero hosting complejo, despliegue instantáneo en GitHub Pages. No es deuda técnica mientras se entienda como maqueta. El riesgo es tratarlo como producción: no tiene seguridad real ni multiusuario concurrente.

---

## 2. Decisión clave: backend para la versión real (Fase 2)

La pregunta central de arquitectura es **qué backend** sustituye a `localStorage`. Evaluación de las dos opciones líderes:

### 2.1 Firebase (Firestore + Auth)

**A favor:**
- Integración madura con Angular (`@angular/fire`).
- Auth lista (correo, Google) con poco código.
- Tiempo real nativo, ideal para stock que cambia.
- Reglas de seguridad **junto a los datos**.

**En contra / cuidados:**
- RBAC: los **custom claims tienen límite de 1.000 bytes** por usuario → solo sirven para IDs de tenant/rol, no para permisos detallados. Patrón oficial de Firebase: **almacenar roles como documentos** (campo `roles: {uid: rol}` en el recurso, o **colección de roles aparte** para grupos grandes).
- Las reglas de seguridad son difíciles de depurar y testear (trial-and-error).
- Modelo NoSQL: los **reportes que cruzan datos** (ABC, márgenes por categoría, WAC histórico) son más incómodos que en SQL.
- Costo por **lecturas**: un dashboard de inventario lee muchos documentos; vigilar facturación.

### 2.2 Supabase (PostgreSQL + Auth + RLS)

**A favor:**
- **Row Level Security (RLS)** en PostgreSQL: políticas de autorización en SQL, aplicadas idénticamente desde navegador, móvil o backend. Más robusto para SaaS multi-tenant a medida que crecen los roles.
- SQL relacional → **reportes y agregaciones** (ABC, WAC, márgenes) son naturales y potentes.
- Aislamiento de tenants por esquemas/políticas con confianza.

**En contra / cuidados:**
- Auth y tiempo real algo menos "llave en mano" que Firebase (aunque cubiertos).
- Requiere modelar SQL y políticas RLS (más diseño inicial).

### 2.3 Recomendación senior

> **Para Inventra, Supabase (PostgreSQL + RLS) es la opción técnicamente superior** dada la naturaleza del producto: inventario relacional con **reportes analíticos** (WAC, ABC, cobertura, márgenes) y un **modelo de permisos por rol que crecerá**. RLS hace cumplir los permisos **en el motor de datos**, no solo en el cliente — exactamente lo que hoy falta.

**Sin embargo**, si la prioridad es **velocidad de entrega y tiempo real**, **Firebase es perfectamente válido** y ya está contemplado en memoria del proyecto. Ambos cumplen multi-tenancy.

**Criterio de desempate:**
- ¿El equipo domina SQL y habrá reportes complejos / auditoría fina? → **Supabase**.
- ¿Se prioriza salir rápido, sincronización en vivo y menos backend? → **Firebase**.

> ⚠️ Punto innegociable en cualquiera de las dos: los permisos deben validarse en el **servidor** (RLS o Security Rules), no solo con `can()` en el cliente como hoy. El modelo `ROLES`/`PERMISSIONS` del prototipo se traduce directamente a políticas RLS (Supabase) o a reglas + colección de roles (Firebase).

---

## 3. Arquitectura objetivo recomendada

```
┌─────────────────────────────────────────────────┐
│  Cliente — Angular 21 (SPA)                       │
│  • Standalone components + Signals (estado)       │
│  • Zoneless change detection                      │
│  • Guards de ruta por permiso (UX)                │
│  • Vitest para pruebas                            │
└───────────────┬─────────────────────────────────┘
                │ SDK (@angular/fire o supabase-js)
┌───────────────▼─────────────────────────────────┐
│  Backend gestionado (Firebase o Supabase)         │
│  • Auth: login real (correo / Google)             │
│  • Datos: Firestore  ó  PostgreSQL                │
│  • Seguridad SERVIDOR: Security Rules ó RLS        │
│    ← deriva de ROLES/PERMISSIONS del prototipo    │
│  • Tiempo real para stock                         │
└─────────────────────────────────────────────────┘
```

**Principios:**
1. **Seguridad en el servidor**, no en el cliente. El `can()` del front es solo para UX (ocultar botones); la verdad la hace RLS/Rules.
2. **Stock derivado de movimientos** (como ya hace el prototipo) — mantener la trazabilidad.
3. **Multi-tenant** por `tenantId` con aislamiento forzado por políticas de seguridad.
4. **Estado con signals**; datos remotos con `resource()`/`httpResource()` o el cliente del backend.
5. **Migración incremental**: portar feature por feature desde el prototipo al `src/` Angular, validando cada una contra los docs 04 (reglas) y 06 (verticales).

---

## 4. Acciones recomendadas (priorizadas)

| # | Acción | Por qué |
|---|--------|---------|
| 1 | **Decidir backend** (Supabase vs Firebase) con el criterio de §2.3 | Bloquea todo el diseño de Fase 2 |
| 2 | Alinear `src/` a v21: signals, zoneless, quitar `zone.js`, Vitest | Evitar construir sobre patrones que ya no son default |
| 3 | Traducir `ROLES`/`PERMISSIONS` a políticas de servidor (RLS o Rules) | Seguridad real — hoy es el mayor gap |
| 4 | Portar las reglas de negocio (doc 04) y verticales (doc 06) al `src/` | El esqueleto Angular no las tiene aún |
| 5 | Definir modelo de datos relacional/documental para joyería (oro, quilataje, spot) | Persistir lo construido en Fase 1 |

---

## Fuentes

- [Angular — Roadmap oficial](https://angular.dev/roadmap)
- [Angular — Versiones y releases](https://angular.dev/reference/releases)
- [Angular v21 Release](https://angular.dev/events/v21)
- [Firebase — Role-based access en Firestore (oficial)](https://firebase.google.com/docs/firestore/solutions/role-based-access)
- [Supabase vs Firebase (Bytebase, 2026)](https://www.bytebase.com/blog/supabase-vs-firebase/)
- [Firebase vs Supabase: escalabilidad (DEV Community, 2025)](https://dev.to/dev_tips/firebase-vs-supabase-in-2025-which-one-actually-scales-with-you-2374)
- [Multi-tenant Firebase + RBAC (DEV Community)](https://dev.to/leo_rio/managing-production-firebase-infrastructure-multi-environment-deployment-for-a-react-pwa-1nfp)
