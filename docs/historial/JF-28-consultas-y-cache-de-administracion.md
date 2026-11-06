# JF-28 — Consultas y caché de administración

- **Identificador:** JF-28
- **Fecha de documentación:** 2026-11-06

Fecha: **6 de noviembre de 2026**. Registro escrito durante la implementación. Antecedentes: [JF-10](JF-10-panel-de-administracion.md), [JF-16](JF-16-cache-inicial-y-guardados-sin-cambios.md) y [JF-27](JF-27-miniaturas-y-selector-de-portada.md).

## Necesidad y medición inicial

El usuario percibía lentitud en el panel y pidió reducir las consultas repetidas. Se midieron cuatro respuestas HTML completas por sección del dominio real con una sesión administrativa, sin modificar datos comerciales. El resumen ejecutaba 8 consultas en cada petición, productos 4, y pedidos, clientes, imágenes, configuración e historial 3. Las consultas SQL sumaban menos de un milisegundo por respuesta en esta muestra; los tiempos HTTP incluían red, autenticación y renderizado. Por tanto, las cifras no atribuyen toda la sensación de lentitud a PostgreSQL.

El verificador conserva únicamente rutas, duraciones y contadores agregados. No exporta correos, cuerpos HTML privados, cookies ni parámetros SQL. Los contadores de `pg_stat_statements` pueden incluir actividad concurrente.

## Decisiones y comportamiento resultante

- `admin-cache.ts` conserva promesas de lectura en memoria del servidor durante un máximo de cinco minutos, con un límite de 200 entradas y expulsión de las menos utilizadas. Peticiones concurrentes de la misma lista comparten la lectura. Una lectura fallida se retira para permitir reintentar.
- Cada clave distingue sección, búsqueda, página y filtros. Los datos de edición también se separan por sección e identificador. Las listas siguen leyendo 31 registros para mostrar 30 y detectar la página siguiente sin una consulta de conteo adicional.
- Todas las funciones de `admin-data.ts` y `media-options.ts` comprueban autorización antes de acceder a datos reutilizados. Equipo conserva el requisito de propietario. La caché nunca contiene contraseñas ni sesiones.
- La sesión se comprueba en PostgreSQL en cada petición mediante un `JOIN` parametrizado entre Session y User, con caducidad y estado activo. Antes Prisma hacía dos lecturas. React deduplica dentro del renderizado y AsyncLocalStorage dentro de cada petición API; no se reutilizan permisos entre peticiones.
- El resumen agrupa los seis resultados anteriores en una sentencia SQL. Los importes siguen expresados en céntimos y se excluyen ingresos de pedidos cancelados.
- Se mantiene una instancia Prisma por proceso también en producción.
- Las mutaciones invalidan las etiquetas correspondientes después del commit y antes de publicar cambios públicos. Productos y categorías actualizan sus listas relacionadas y el resumen; pedidos actualizan listas, clientes y resumen, e inventario cuando cambia; cuentas, imágenes, páginas, cupones y auditoría invalidan sus propios datos. Los reintentos idempotentes y guardados sin cambios no provocan invalidaciones comerciales innecesarias.
- Los enlaces privados tienen `prefetch={false}`: ni el enlace de la marca ni cada fila del listado ejecutan lecturas anticipadas de otras pantallas. La primera prueba de navegador detectó cuatro peticiones RSC adicionales a `/admin` durante dos refrescos de biblioteca; tras retirarlo, la prueba exige como máximo una petición administrativa por lote. La precarga de la tienda pública se conserva.
- El menú dispone de “Actualizar datos” para forzar una lectura de la sección actual. No ejecuta sondeos ni recargas periódicas. El formulario de muebles navega una vez al listado al guardar o archivar, evitando combinar navegación y otra recarga inmediata.

La tienda pública conserva su publicación persistida y su precarga; esta caché administrativa es independiente. El panel requiere autenticación y sus respuestas privadas no se convierten en contenido público estático.

## Archivos y tecnologías

Código principal: [admin-cache.ts](../../src/lib/admin-cache.ts), [admin-data.ts](../../src/lib/admin-data.ts), [auth.ts](../../src/lib/auth.ts), [db.ts](../../src/lib/db.ts), [API](../../src/app/api/[...path]/route.ts), [pedidos](../../src/lib/orders.ts), [imágenes](../../src/lib/media.ts), [selector](../../src/lib/media-options.ts), [resumen](../../src/app/admin/page.tsx), [secciones](../../src/app/admin/[section]/page.tsx) y [componentes](../../src/components/admin.tsx).

Se utilizan Map y Promise de JavaScript, AsyncLocalStorage de Node, React, Prisma y SQL parametrizado de PostgreSQL. No se añade Redis ni otra dependencia. La memoria local resulta suficiente para la única instancia actual y evita instalar infraestructura adicional para unas pocas listas paginadas.

## Operación y límites

La invalidación inmediata cubre escrituras realizadas por esta aplicación. Una escritura SQL externa se observa al caducar la entrada o al pulsar Actualizar datos. Reiniciar el proceso vacía la caché. Con varias réplicas sería necesario propagar invalidaciones entre procesos antes de prometer la misma frescura.

No se puede eliminar la consulta de sesión manteniendo revocación inmediata de permisos. Una entrada todavía en proceso cuando ocurre una escritura se elimina del mapa y no vuelve a insertarse al terminar; las siguientes peticiones leen datos nuevos.

## Validación

Las pruebas unitarias comprueban deduplicación, invalidación selectiva, la carrera entre lectura y escritura, recuperación de fallos y caducidad. Las pruebas de navegador comprueban la aparición y retirada inmediata de imágenes y que una sesión revocada no acceda al selector aunque sus datos estén en caché.

Las mediciones definitivas y la comprobación de despliegue se enlazan en [verificación](../VERIFICATION.md). Script reproducible: [benchmark-admin.mjs](../../scripts/benchmark-admin.mjs). Los nuevos resultados deben compararse con las mediciones anteriores sin convertir una muestra local en garantía para todas las conexiones.

## Resultado observado tras desplegar

En el dominio real, sin precalentar el panel desde el verificador: resumen 2 consultas en la primera petición y 1 en las repetidas; productos 3 y 1; pedidos, clientes, imágenes, configuración e historial 2 y 1. La consulta restante es la comprobación actual de sesión. En la primera lectura de productos, Prisma conserva una consulta adicional para los nombres de categoría; las visitas repetidas reutilizan el conjunto completo.

Pasaron 10 pruebas unitarias y 16 de navegador. Se verificó el menú y el selector en producción sin modificar contenido comercial. Los resultados completos anteriores y posteriores están en [mediciones](../admin-performance-verification.json). La copia de seguridad previa al despliegue terminó correctamente; la imagen y salud del servicio figuran en [verificación](../VERIFICATION.md).

La medición pública final completó 105 respuestas HTML sin consultas públicas adicionales. Un primer intento del verificador se interrumpió por un reinicio de conexión TLS; la ejecución completa posterior terminó correctamente y es la que se conserva en el informe público.
