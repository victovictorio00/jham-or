# JF-27 — Miniaturas y selección de portada sin recargar el editor

- **Identificador:** JF-27
- **Fecha de documentación:** 2026-11-05
- **Tipo:** mejora de carga y consultas administrativas.
- **Solicitud:** reducir la espera al elegir una imagen de portada.

## Causa identificada

La vista previa de 100 × 80 px utilizaba el original con optimización desactivada, que podía medir hasta 1600 px. Elegir la imagen no requería una consulta nueva a PostgreSQL; la espera incluía descargar y presentar un archivo mucho mayor de lo necesario.

Actualizar la biblioteca usaba `router.refresh`, que volvía a obtener el contenido del editor completo en lugar de solicitar solo sus opciones de imagen.

## Miniaturas

Las nuevas subidas producen el original normalizado y una miniatura WebP de hasta 360 px, calidad 75 y sin ampliación. La URL se guarda en el nuevo campo opcional `Media.thumbnailUrl`.

El selector y la biblioteca utilizan la miniatura cuando está disponible. Para imágenes sin miniatura, la vista previa utiliza la optimización de Next con un tamaño apropiado. Elegir una opción cambia el estado local y solicita únicamente la imagen correspondiente, sin una llamada a la API de biblioteca.

Se añadió un índice sobre `Media.createdAt` para apoyar las opciones recientes. La migración es aditiva y no sustituye archivos originales ni filas de medios existentes.

## Actualización de opciones

`/api/admin/media-options` exige permiso administrativo y devuelve como máximo 200 imágenes recientes más las referencias de muestra. El botón Actualizar biblioteca usa esa petición específica y conserva los valores del formulario.

La configuración y sus opciones iniciales se obtienen en paralelo una vez autorizada la página. El cambio de selección no vuelve a consultar la lista ni publica la portada hasta pulsar Guardar.

## Compatibilidad con imágenes anteriores

`scripts/backfill-media-thumbnails.mjs` prepara miniaturas para registros anteriores cuyo campo es nulo. Procesa lotes con avance por identificador, mantiene los originales y no reinicia los datos comerciales. Se incluye en la imagen de ejecución para poder actuar sobre el volumen de subidas con los permisos de la aplicación.

En esta entrega se ejecutó dentro del contenedor después del despliegue: se generó la miniatura de 1 imagen anterior, sin archivos pendientes por fallo. La ausencia de miniatura conserva una alternativa funcional; no se trata como ausencia del original.

## Precarga y cambios rápidos

La precarga pública deja de continuar trabajos cuyo recurso ya tiene una revisión posterior. Esto reduce solicitudes obsoletas, por ejemplo cuando una portada se cambia y su imagen anterior se elimina después de dejar de estar referenciada. La navegación pública sigue utilizando la copia publicada y no incorpora consultas nuevas por esta mejora del editor.

## Archivos afectados

- `prisma/schema.prisma` y migración `20261105020000_media_thumbnails`.
- `src/lib/media-options.ts` y endpoint de opciones.
- `src/components/admin.tsx` y página administrativa.
- `src/app/media/[name]/route.ts`, con entrega de originales y miniaturas.
- Script de adaptación de medios y Dockerfile.
- `src/lib/prewarm.ts`, con control de revisiones obsoletas.

## Validación

Se comprobó que una subida genera WebP de hasta 360 px, que el selector utiliza esa URL, que cambiar de opción realiza cero llamadas a la API y que actualizar la biblioteca realiza una petición específica sin solicitar otra página RSC ni perder texto sin guardar.

Se verificó además un lote de 51 imágenes anteriores: se generaron 51 miniaturas, sin registros pendientes, y se retiraron los archivos de prueba. Esto comprueba el avance entre lotes sin saltar un registro al actualizar el filtro de miniaturas nulas.

Las mediciones históricas anteriores no se presentan como tiempos nuevos de esta pantalla. La mejora se verifica por los archivos solicitados y el número de peticiones, además de su funcionamiento en navegador.

## Referencias

- [Publicación estática](JF-17-publicacion-estatica-y-consultas.md).
- [Opciones de imágenes](../../src/lib/media-options.ts).
- [Adaptación de medios](../../scripts/backfill-media-thumbnails.mjs).
- [Pruebas del selector](../../tests/e2e/admin-media.spec.ts).
