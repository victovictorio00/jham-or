# JF-17 — Publicación estática y eliminación de SQL público por visita

- **Identificador:** JF-17
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** 0614d4d.

## Petición que motivó el cambio

El usuario indicó que sentía la web pesada y pidió un comportamiento similar al de una web estática: preparar el contenido y actualizarlo cuando hubiera cambios, en lugar de consultar la base de datos al iniciar cada visita.

Se cambió la fuente de lectura pública y la forma de generar HTML. No se utilizó una caché compartida para convertir sesiones o pedidos privados en documentos estáticos.

## Copia publicada

`PublicSnapshot` contiene versión, revisiones por recurso, ajustes públicos, categorías activas, productos públicos y páginas publicadas. No incluye usuarios, sesiones, pedidos, hashes de contraseña ni secretos.

En producción se conserva en `/app/publication/store.json`, dentro del volumen `jhamor_publication`. En desarrollo, la ruta por defecto es `var/publication.json`, salvo que se indique `PUBLICATION_FILE`.

`readPublishedSnapshot` deduplica la lectura del archivo en memoria. `replacePublishedSnapshot` sustituye la versión en memoria tras publicar. Los lectores de `catalog.ts` usan etiquetas de Next.js y `revalidate: false`, sin importar Prisma.

## Escritura y revisión transaccional

En la misma transacción que modifica un recurso público, `markPublication` actualiza la revisión de `catalog`, `settings` o `pages`. Confirmar datos y revisión conjuntamente permite detectar una publicación pendiente después de una interrupción.

Después se exporta únicamente el recurso afectado mediante una transacción `RepeatableRead`, con los campos públicos seleccionados. El grupo `catalog` incluye categorías y productos; los otros grupos mantienen su ámbito.

La escritura del JSON utiliza un archivo temporal y un renombrado. Se reemplaza la copia completa en una operación de archivo, evitando exponer una escritura parcial como versión publicada.

## HTML y filtros

La tienda dejó de forzar el render dinámico en su layout. Las fichas y páginas utilizan generación de slugs y configuración estática, admitiendo también nuevos slugs publicados posteriormente.

El catálogo público recibe tarjetas y filtra en el navegador. Una búsqueda inédita no necesita crear una nueva consulta SQL ni una entrada de caché de consultas por cada término.

## Invalidación selectiva

| Cambio | Recurso publicado |
| --- | --- |
| Producto, categoría, actividad o stock | `catalog`. |
| Portada, contacto, envío o textos generales | `settings`. |
| Página, texto o estado de publicación | `pages`. |
| Cupón, datos de cliente o permiso | Sin republicación del catálogo por ese motivo. |
| Estado/pago del pedido sin alterar existencias | Sin republicación del catálogo por ese motivo. |

Se invalida la etiqueta del recurso, las rutas necesarias y el sitemap. Se precarga después de responder. Si una visita se adelanta a la precarga, puede generar HTML desde la copia sin introducir una lectura de las tablas comerciales.

## Lo que sigue consultando la base

Compras, inventario, sesiones, permisos y administración siguen comprobándose en PostgreSQL. Los healthchecks realizan `SELECT 1`. Al arrancar hay una lectura pequeña de revisiones, y una exportación si hay cambios pendientes.

Por tanto, la afirmación comprobada es **cero SQL de contenido público por navegación**, no “la aplicación nunca usa PostgreSQL”.

- [Exportación y revisión](../../src/lib/publication.ts).
- [Lectura publicada](../../src/lib/published.ts).
- [Invalidación y precarga](../../src/lib/publish-runtime.ts).
- [Explicación operativa](../PUBLICATION.md).
