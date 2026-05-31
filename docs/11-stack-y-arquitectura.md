# 11 · Stack tecnológico y arquitectura

> Documento de arquitectura **as-built** (lo que existe hoy) y **to-be** (hacia dónde va).
> Última actualización: 2026-05-30.

Este documento describe el stack tecnológico real de Inventra y su arquitectura. A diferencia de [07-arquitectura-sugerida](07-arquitectura-sugerida.md) (que propone un diseño objetivo), aquí se documenta **lo que está construido y desplegado hoy**, y se distingue de lo que es plan futuro.

---

## ⚠️ Punto clave: dos realidades en el repositorio

El repositorio contiene **dos bases de código distintas** que conviene no confundir:

| | `prototype.html` | `src/` (Angular) |
|---|------------------|------------------|
| **Qué es** | La aplicación **real, funcional y desplegada** | Esqueleto/andamiaje de la arquitectura objetivo |
| **Estado** | ✅ Completo y en producción | 🚧 Incompleto, sin dependencias instaladas |
| **Funcionalidad** | Todo: joyería, oro, roles, WAC, ABC, insights | Stubs básicos; **sin** joyería/oro/roles |
| **Despliegue** | Sí → `deploy/index.html` → GitHub Pages | No se despliega |
| **Tecnología** | HTML + CSS + JavaScript vanilla, 1 archivo | Angular 21 + TypeScript |

**La fuente de verdad operativa es `prototype.html`.** El directorio `src/` representa la dirección arquitectónica futura, pero hoy no está al día con las funcionalidades.

---

## 1. Stack ACTUAL (lo desplegado) — Prototipo de página única

### 1.1 Tecnologías

| Capa | Tecnología | Detalle |
|------|-----------|---------|
| **Lenguaje** | JavaScript (ES2020+) vanilla | Sin transpilación, sin framework |
| **UI / Markup** | HTML5 generado por funciones JS | Render por strings de template (`innerHTML`) |
| **Estilos** | CSS3 embebido | Variables CSS (`--primary`, `--surface`…), sin preprocesador |
| **Persistencia** | `localStorage` del navegador | Claves `inventra.demo.*` (JSON serializado) |
| **Estado** | Objeto global `store` en memoria | Hidratado desde `localStorage` al cargar |
| **Build** | Ninguno | Es un único `.html` autocontenido |
| **Hosting** | GitHub Pages | Sirve `index.html` estático |

### 1.2 Características arquitectónicas

- **Single-file app**: todo (HTML, CSS, JS) vive en `prototype.html`. No hay dependencias externas ni CDN.
- **Sin backend**: toda la lógica corre en el navegador. No hay servidor ni API.
- **Routing por hash**: `location.hash` (`#dashboard`, `#products`, `#users`…) → `currentView` → función `viewX()`.
- **Render imperativo**: `render()` reconstruye el HTML de la vista activa y lo inyecta en el DOM. No hay reactividad ni virtual DOM.
- **Multi-tenant por vertical**: el comportamiento se adapta al `tenant.vertical` (retail, bakery, hardware, pharmacy, petshop, **jewelry**, other).

### 1.3 Estructura interna de `prototype.html`

Organizado en secciones lógicas (comentarios `// ---------- X ----------`):

```
Constantes y claves LS  → LS_TENANT, LS_USERS, ROLES, PERMISSIONS, VERTICALS, GOLD_KARATS
Modelo de oro/permisos  → karatPurity(), goldValue(), can(), requirePerm()
Estado (store)          → load()/save() sobre localStorage
Derivados               → stockByProduct(), lowStockProducts(), costOf() (WAC)…
Mutaciones              → createProduct(), registerMovement() (con guards de permiso)
Seed / demo             → seedDemoCompany(), onboarding
Vistas (render)         → viewDashboard(), viewProducts(), viewStockIn/Out(),
                          viewReports(), viewInsights(), viewUsers()…
Render principal        → render(), renderSidebar()
Bootstrap               → carga demo si no hay datos, luego render()
```

### 1.4 Modelo de datos (en `localStorage`)

| Clave | Contenido |
|-------|-----------|
| `inventra.demo.tenant` | Empresa: nombre, `vertical`, moneda, zona horaria |
| `inventra.demo.user` | Usuario creador (legacy) |
| `inventra.demo.users` | **Lista de usuarios con `role`** (owner/manager/cashier/stock/viewer) |
| `inventra.demo.activeUser` | Id del usuario activo (selector "operar como") |
| `inventra.demo.branches` | Sucursales |
| `inventra.demo.settings` | Valoración (WAC/FIFO), `goldSpotPerGram`, umbrales |
| `inventra.demo.products` | Productos: sku, nombre, unidad, `karat`, costo, precio, mínimo |
| `inventra.demo.movements` | Movimientos: entradas/salidas/ajustes con cantidad y costo/precio |

El **stock nunca se almacena directamente**: se deriva sumando los movimientos (`stockByProduct()`), lo que garantiza trazabilidad.

### 1.5 Seguridad (estado actual)

- ⚠️ **No hay seguridad real.** Los roles y permisos (`can()`, `requirePerm()`) se aplican **solo en el cliente** (ocultan UI y bloquean mutaciones en memoria).
- Cualquiera con acceso al navegador puede editar `localStorage`.
- Es adecuado para **demo y validación con el cliente**, no para producción con datos reales.
- La seguridad real está planificada para la Fase 2 (ver §3).

---

## 2. Stack OBJETIVO (esqueleto presente) — Angular SPA

Definido en [07-arquitectura-sugerida](07-arquitectura-sugerida.md) y parcialmente andamiado en `src/`.

### 2.1 Tecnologías

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Angular | 21.x (standalone components) |
| **Lenguaje** | TypeScript | ~5.6 |
| **Reactividad** | RxJS | ~7.8 + Signals de Angular |
| **Runtime Angular** | zone.js | ~0.15 |
| **Build/CLI** | `@angular/build`, `@angular/cli` | 21.x |
| **Estado** | Store basado en señales | `core/state/inventory.store.ts` |

### 2.2 Estructura de `src/`

```
src/
├── main.ts, index.html, styles.css
└── app/
    ├── app.component.ts / app.config.ts / app.routes.ts
    ├── core/
    │   ├── models/          → product.model.ts, movement.model.ts
    │   └── state/           → inventory.store.ts
    ├── features/            → dashboard, products, stock-in, stock-out,
    │   │                       movements, alerts (cada uno con *.routes.ts + pages/)
    └── shared/
        ├── layout/          → shell.component.ts, sidebar.component.ts
        └── ui/              → stat-card, empty-state, toast-*
```

Patrón: **feature-based** con lazy routes, componentes standalone, capa `core` (modelos + estado) y `shared` (UI reutilizable).

### 2.3 Brechas del esqueleto Angular respecto al prototipo

El `src/` **no** incluye todavía: vertical de joyería, oro/quilataje/spot, sistema de roles y permisos, onboarding, motor de insights/ABC, ni cálculo WAC completo. Migrar estas capacidades es trabajo pendiente.

---

## 3. Roadmap arquitectónico

| Fase | Estado | Descripción |
|------|--------|-------------|
| **Fase 0** | ✅ Hecho | Prototipo single-file funcional desplegado en GitHub Pages |
| **Fase 1** | ✅ Hecho | Joyería (oro, gramos, quilataje, spot) + roles/permisos en el prototipo |
| **Fase 2** | ⏳ Pendiente | **Firebase**: Authentication (login real) + Firestore (datos en la nube + reglas de seguridad por rol). La tabla de permisos de Fase 1 se traduce a reglas de Firestore. |
| **Fase 3** | 🔭 Futuro | Completar la SPA Angular consumiendo Firebase; retirar `localStorage` |

### Firebase (Fase 2) — racional

- **Auth**: contraseña / Google. Sustituye el selector "operar como" sin seguridad.
- **Firestore**: base de datos por tenant; los permisos se validan en el servidor (no solo en el cliente).
- **Custom claims** por rol → reglas de seguridad derivadas de `PERMISSIONS`/`ROLES`.
- Herramienta: Firebase CLI (`npx -y firebase-tools@latest`).

---

## 4. Despliegue (CI/CD actual)

| Aspecto | Detalle |
|---------|---------|
| **Origen** | `prototype.html` (editar aquí) |
| **Artefacto** | Copiar a `deploy/index.html` |
| **Repo de Pages** | `deploy/` es un repo git propio → `recursosdigitaleshub-code/inventra-demo` |
| **Publicación** | `git push origin main` desde `deploy/` |
| **Credenciales** | Solo la cuenta `recursosdigitaleshub-code` tiene escritura (`gh auth switch` antes de pushear) |
| **URL pública** | https://recursosdigitaleshub-code.github.io/inventra-demo/ |

Flujo completo:
```bash
cp prototype.html deploy/index.html
cd deploy
git add index.html && git commit -m "..." && git push origin main
```

> El despliegue y el push se hacen **siempre juntos** tras editar `prototype.html`.

---

## 5. Resumen ejecutivo del stack

- **Hoy en producción:** aplicación web de **página única** en **HTML/CSS/JavaScript vanilla**, sin backend, datos en `localStorage`, hospedada en **GitHub Pages**. Cero dependencias, cero build.
- **Arquitectura objetivo:** **Angular 21 + TypeScript** (SPA) sobre **Firebase** (Auth + Firestore) para seguridad y datos reales.
- **Seguridad:** los roles/permisos funcionan en el prototipo a nivel de interfaz; la seguridad de verdad llega con Firebase (Fase 2).
