# 02 · Requisitos no funcionales

Los requisitos no funcionales (RNF) definen **cómo** debe comportarse el sistema, más allá de qué funcionalidad ofrece.

---

## RNF-PF · Rendimiento

**RNF-PF-001** · El tiempo de carga inicial (primera pintura útil) **debe** ser menor a 3 segundos en una conexión 4G.

**RNF-PF-002** · El tiempo de respuesta de las vistas principales (dashboard, productos, movimientos, reportes) **debe** ser menor a 2 segundos con:
- 1.000 productos activos.
- 100.000 movimientos históricos.
- 30 días de actividad en pantalla.

**RNF-PF-003** · El cálculo de stock derivado **debe** evitarse a nivel de base de datos por cada lectura: se **debe** mantener un saldo pre-calculado actualizado por trigger o evento al registrar cada movimiento. La verdad formal sigue siendo la suma de movimientos, pero para lectura se consulta el saldo cacheado.

**RNF-PF-004** · Los cálculos pesados (ABC, pronóstico para todo el catálogo, health score) **deben** poder correr en menos de 500 ms para 1.000 productos × 30 días de movimientos.

**RNF-PF-005** · Los reportes **deben** paginarse cuando el resultado supere 500 filas, con scroll infinito o paginación numerada.

**RNF-PF-006** · La exportación CSV **debe** manejar hasta 100.000 filas sin bloquear el navegador (usar streams o web workers si es necesario).

---

## RNF-SC · Escalabilidad

**RNF-SC-001** · La arquitectura **debe** soportar crecimiento horizontal a nivel de API sin requerir re-arquitectura mayor.

**RNF-SC-002** · La base de datos **debe** estar particionada por `tenant_id` como llave de sharding futura (aunque en MVP no se use sharding real).

**RNF-SC-003** · Cada tenant **debe** poder operar aislado: los cálculos, queries y caches de un tenant **no deben** verse afectados por la actividad de otros.

**RNF-SC-004** · El sistema **debe** estar diseñado para soportar al menos 10.000 tenants activos con 1.000 productos promedio cada uno (10M productos, 1B movimientos en el agregado).

---

## RNF-AV · Disponibilidad y continuidad

**RNF-AV-001** · La disponibilidad objetivo del servicio **debe** ser ≥ 99.5% mensual (equivale a ~3.5 horas de indisponibilidad al mes).

**RNF-AV-002** · El sistema **debe** tener backups automáticos diarios con retención mínima de 30 días.

**RNF-AV-003** · El RPO (Recovery Point Objective) **debe** ser ≤ 1 hora. El RTO (Recovery Time Objective) **debe** ser ≤ 4 horas.

**RNF-AV-004** · La app web **debería** funcionar en modo offline para operaciones críticas (registrar entrada, registrar salida, consultar stock del último estado conocido), con sincronización automática al recuperar conexión. En el MVP puede limitarse a una advertencia visible cuando no hay conexión.

---

## RNF-SG · Seguridad

**RNF-SG-001** · Toda comunicación entre cliente y servidor **debe** usar HTTPS/TLS 1.2 o superior.

**RNF-SG-002** · Las contraseñas **deben** almacenarse con hash seguro (bcrypt, argon2). Nunca en texto plano ni con hashes débiles (MD5, SHA1).

**RNF-SG-003** · La autenticación **debe** emitir tokens de sesión (JWT o equivalente) con expiración ≤ 12 horas y refresh tokens rotados.

**RNF-SG-004** · El sistema **debe** proteger contra los ataques OWASP Top 10: inyección SQL, XSS, CSRF, autenticación rota, exposición de datos sensibles, etc.

**RNF-SG-005** · Todas las operaciones **deben** verificar que el tenant del token coincide con el tenant del recurso solicitado. Nunca permitir que un tenant lea/modifique datos de otro.

**RNF-SG-006** · Los logs **no deben** contener credenciales, tokens, ni datos personales sensibles.

**RNF-SG-007** · El sistema **debe** tener rate limiting en endpoints públicos (login, onboarding) para prevenir ataques de fuerza bruta.

**RNF-SG-008** · Las dependencias **deben** auditarse periódicamente (npm audit, Snyk o equivalente) y mantenerse actualizadas.

---

## RNF-AU · Auditoría y trazabilidad

**RNF-AU-001** · Los movimientos de inventario **deben** ser inmutables. Una vez registrados, no pueden editarse ni eliminarse.

**RNF-AU-002** · Toda corrección **debe** hacerse a través de un nuevo movimiento (ajuste positivo o negativo con motivo).

**RNF-AU-003** · Cada movimiento **debe** registrar: usuario que lo creó, timestamp exacto en UTC, IP de origen (opcional pero recomendable).

**RNF-AU-004** · El sistema **debe** mantener un log de acciones administrativas (cambios de configuración, creación/edición de productos, altas de usuarios) con el usuario responsable y la fecha.

**RNF-AU-005** · Los logs de auditoría **deben** conservarse mínimo 2 años.

---

## RNF-I18 · Internacionalización y localización

**RNF-I18-001** · El idioma del producto **debe** ser español Colombia como único idioma soportado en el MVP.

**RNF-I18-002** · Los textos **no deben** contener formas voseo argentinas (prohibido: "empezá", "probá", "planificá", "considerá", "tenés", "querés", etc.).

**RNF-I18-003** · El sistema **debe** soportar las siguientes monedas en el MVP: COP, USD, MXN, EUR, PEN, CLP, ARS, BRL. La moneda se configura por tenant en el onboarding.

**RNF-I18-004** · Los montos **deben** formatearse con separador de miles según la moneda:
- COP: `$1.234.567` (punto como separador de miles, sin decimales para pesos colombianos).
- USD/EUR: `$1,234.56` (coma para miles, punto para decimales).
- El formato **debe** seguir el locale de la moneda, no el navegador del usuario.

**RNF-I18-005** · Las fechas **deben** formatearse en formato `dd/mm/aaaa` con hora en 24h para visualización.

**RNF-I18-006** · Las fechas en APIs y CSV **deben** estar en ISO 8601 UTC.

**RNF-I18-007** · La zona horaria se configura por tenant y se usa para mostrar fechas localmente. El almacenamiento interno es siempre UTC.

**RNF-I18-008** · La arquitectura **debe** permitir añadir nuevos idiomas (inglés, portugués) en v2 sin cambios estructurales.

---

## RNF-UX · Experiencia de usuario

**RNF-UX-001** · Las decisiones de diseño **deben** priorizar legibilidad y simplicidad sobre densidad de información.

**RNF-UX-002** · Ningún flujo crítico (registrar entrada, registrar salida) **debe** requerir más de 3 clics desde el dashboard.

**RNF-UX-003** · Las acciones destructivas (eliminar producto, restaurar demo, descartar cambios) **deben** pedir confirmación explícita.

**RNF-UX-004** · Las notificaciones (toasts) **deben** ser no bloqueantes y auto-descartarse (3.5 s éxito/info, 5 s error).

**RNF-UX-005** · Los formularios **deben** validar en vivo (onInput/onBlur) y mostrar errores junto al campo, no en un banner separado.

**RNF-UX-006** · La UI **debe** ser responsive para tablet y desktop. En móvil (< 768 px) **puede** degradar ciertas vistas densas (reportes) a un formato simplificado.

**RNF-UX-007** · Los iconos con significado (semáforos, alertas, status) **deben** ir acompañados de texto o tooltip: no se **debe** depender solo del color.

**RNF-UX-008** · El sistema **debe** tener estados vacíos útiles: cuando no hay productos, mostrar "crea tu primer producto" con CTA; nunca una tabla vacía sin explicación.

---

## RNF-AC · Accesibilidad

**RNF-AC-001** · La aplicación **debe** cumplir WCAG 2.1 nivel AA como objetivo mínimo.

**RNF-AC-002** · El contraste de texto vs. fondo **debe** ser ≥ 4.5:1 para texto normal y ≥ 3:1 para texto grande.

**RNF-AC-003** · Todos los controles interactivos **deben** ser navegables por teclado. El orden de tab **debe** ser lógico.

**RNF-AC-004** · Los formularios **deben** tener labels explícitos (no solo placeholders) asociados a cada input.

**RNF-AC-005** · Las imágenes con significado **deben** tener `alt` descriptivo. Las decorativas, `alt=""`.

**RNF-AC-006** · Los componentes dinámicos (modales, dropdowns, toasts) **deben** anunciarse con ARIA apropiado.

---

## RNF-MT · Mantenibilidad

**RNF-MT-001** · El código frontend **debe** seguir las convenciones estándar de Angular 21 (style guide oficial).

**RNF-MT-002** · La cobertura de pruebas automatizadas **debería** ser ≥ 70% de líneas para el dominio de negocio (cálculos de inventario, WAC, ABC, pronóstico).

**RNF-MT-003** · Las funciones de cálculo de negocio **deben** ser puras (sin efectos secundarios) y fácilmente testeables de forma unitaria.

**RNF-MT-004** · Cada módulo/feature **debe** tener README con propósito, dependencias y ejemplos de uso.

**RNF-MT-005** · Los commits **deben** seguir convenciones semánticas (Conventional Commits recomendado).

---

## RNF-DT · Datos y privacidad

**RNF-DT-001** · Los datos de cada tenant **deben** estar aislados lógicamente. Queries **no deben** poder cruzar tenants.

**RNF-DT-002** · Los datos personales (nombres, emails, teléfonos) **deben** tratarse conforme a la Ley 1581 de 2012 de Colombia (Habeas Data) y RGPD si aplica.

**RNF-DT-003** · El sistema **debe** permitir al tenant exportar todos sus datos (derecho a la portabilidad).

**RNF-DT-004** · El sistema **debe** permitir eliminar la cuenta de un tenant con eliminación efectiva de datos personales tras período de gracia (30 días).

**RNF-DT-005** · Los datos históricos de movimientos, productos y transacciones se conservan mínimo 5 años (obligación fiscal colombiana).

---

## RNF-DP · Despliegue y operaciones

**RNF-DP-001** · Los despliegues **deben** ser zero-downtime (rolling o blue-green).

**RNF-DP-002** · La infraestructura **debe** estar en una región con baja latencia para Colombia (AWS us-east-1, GCP southamerica-east1, o equivalente).

**RNF-DP-003** · El sistema **debe** tener monitoreo de métricas clave: uptime, latencia p95 de endpoints, error rate, uso de CPU/memoria de servicios.

**RNF-DP-004** · El sistema **debe** tener alertas automáticas cuando:
- Error rate > 1% por más de 5 minutos.
- Latencia p95 > 2 segundos por más de 10 minutos.
- Disponibilidad < 99% en la última hora.

**RNF-DP-005** · Los logs **deben** centralizarse y ser buscables por tenant, usuario, endpoint, rango de fechas.

---

## RNF-CM · Compatibilidad

**RNF-CM-001** · La aplicación web **debe** funcionar correctamente en las últimas 2 versiones estables de: Chrome, Edge, Firefox, Safari.

**RNF-CM-002** · La aplicación **no debe** depender de features experimentales del navegador sin fallback.

**RNF-CM-003** · Los archivos CSV exportados **deben** abrirse correctamente en Microsoft Excel 2016 y posteriores, y en Google Sheets.
