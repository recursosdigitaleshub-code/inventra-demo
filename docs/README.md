# Inventra AI — Documentación del Producto

Esta carpeta contiene la documentación funcional, técnica y de negocio de **Inventra AI**, extraída y formalizada a partir del prototipo navegable (`prototype.html`). Sirve como contrato de producto para el equipo de desarrollo que va a construir la versión real en Angular 21 + backend multiagente.

## Cómo leer esta documentación

- El prototipo (`prototype.html`) es la **referencia de comportamiento**: cuando un documento diga "como se ve en el prototipo", el código ejecutable es la verdad.
- Los documentos aquí son la **fuente de verdad funcional y de negocio**: reglas, fórmulas, flujos, supuestos y motivaciones que no están necesariamente explícitas en el código.
- La arquitectura técnica del documento 07 es una **recomendación**, no un mandato. El equipo puede proponer alternativas mientras se cumplan los requisitos funcionales y no funcionales.

## Índice

| # | Documento | Para quién | Contenido |
|---|-----------|-----------|-----------|
| 00 | [Visión y alcance](00-vision-y-alcance.md) | Todos | Propósito, usuarios objetivo, diferenciadores, alcance del MVP |
| 01 | [Requisitos funcionales](01-requisitos-funcionales.md) | Producto, devs | Qué debe hacer el sistema, por módulo, con criterios de aceptación |
| 02 | [Requisitos no funcionales](02-requisitos-no-funcionales.md) | Devs, QA, SRE | Rendimiento, seguridad, disponibilidad, i18n, auditoría |
| 03 | [Modelo de datos](03-modelo-de-datos.md) | Backend, DB | Entidades, relaciones, campos, reglas de integridad, migraciones |
| 04 | [Reglas de negocio y algoritmos](04-reglas-de-negocio.md) | Devs, producto | WAC, FIFO, cobertura, ABC, pronóstico, salud, insights — fórmulas exactas |
| 05 | [Flujos y vistas](05-flujos-y-vistas.md) | Frontend, UX | Cada pantalla: propósito, datos, acciones, estados, flujos |
| 06 | [Verticales y seed](06-verticales-y-seed.md) | Producto, backend | Configuración por tipo de negocio, catálogos iniciales |
| 07 | [Arquitectura sugerida](07-arquitectura-sugerida.md) | Devs, arquitectos | Stack, multi-agente, módulos backend, frontend Angular 21 |
| 08 | [API y contratos](08-api-contratos.md) | Backend, frontend | Endpoints REST sugeridos, payloads, errores |
| 09 | [Patrones UX/UI](09-ux-ui-patrones.md) | Frontend, diseño | Componentes, tokens, estados, accesibilidad |
| 10 | [Glosario](10-glosario.md) | Todos | Términos del dominio en español Colombia |

## Convenciones

- **Idioma del producto**: español Colombia. Nada de voseo argentino (ver documento 02).
- **Moneda por defecto**: COP (pesos colombianos), pero el sistema es multimoneda.
- **Las palabras "debe / debería / puede"** siguen el sentido RFC 2119:
  - **Debe** = requisito obligatorio.
  - **Debería** = recomendación fuerte, pero negociable.
  - **Puede** = opcional.

## Sobre el prototipo

El archivo `prototype.html` es un HTML autocontenido (vanilla JS + localStorage) pensado para demostraciones comerciales. **No** es la base de código de producción — es una maqueta funcional. El equipo de desarrollo reimplementa desde cero siguiendo esta documentación, usando el prototipo como referencia visual y de comportamiento.

Lo que **sí** se conserva del prototipo para la versión real:
- Las fórmulas de negocio (WAC, ABC, cobertura, pronóstico, salud).
- Los flujos de usuario (orden de las pantallas, pasos del onboarding, tabs de reportes).
- Los textos en español Colombia.
- Las verticales con sus catálogos semilla.

Lo que **no** se conserva:
- La persistencia en localStorage (se reemplaza por backend + base de datos).
- La arquitectura de un solo HTML (se reemplaza por Angular 21 + API).
- La autenticación simulada (se implementa autenticación real).
- La ausencia de multi-usuario y multi-sucursal con permisos granulares.
