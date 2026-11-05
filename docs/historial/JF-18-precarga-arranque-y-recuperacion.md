# JF-18 — Precarga interna, arranque y recuperación de publicaciones

- **Identificador:** JF-18
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** 0614d4d.

## Finalidad

Se pidió cargar internamente la web si era necesario para que la primera visita encontrara el contenido preparado. La aplicación precarga las rutas públicas y variantes principales de imágenes; no espera a que el visitante provoque las primeras lecturas de catálogo.

## Arranque gestionado

`scripts/start.mjs` prepara el directorio de publicación y copia la semilla de la imagen solo si no existe el archivo persistido. Elimina una marca de salud anterior y arranca el servidor standalone como proceso hijo.

Genera un token efímero de 32 bytes y llama por HTTP interno a `/api/internal/prepare`. El endpoint valida el token, compara revisiones, recupera recursos pendientes e invalida artefactos de arranque.

El script obtiene un manifiesto y solicita sus páginas e imágenes con dos trabajadores concurrentes. Solo crea `/tmp/jhamor-ready` cuando termina sin errores. En ese modo el healthcheck devuelve estado de preparación pendiente hasta que existe la marca.

## Qué se precarga

- Inicio y catálogo.
- Nosotros, contacto y estructura de la bolsa.
- Cada ficha de producto publicada.
- Cada página informativa publicada.
- Sitemap.
- Imágenes principales de portada, categorías y productos en anchos comunes.

Los anchos utilizados son 360 y 640 px, y 1440 px adicional para la portada. La lista se deduplica. En el conjunto inicial resultaron 15 páginas y 15 variantes; esos números dependen de los productos y páginas publicados, no son límites fijos.

## Precarga después de editar

`publish-runtime.ts` utiliza `after` para precargar después de completar la respuesta. El ámbito depende del recurso: catálogo, páginas o configuración. Dos trabajadores y tiempos de espera acotan la concurrencia de estas solicitudes.

Un fallo de precarga se registra. La copia pública ya escrita puede servir para generar el HTML cuando se visite la ruta. No se describen aquí reintentos infinitos de precarga que el código no implementa.

## Recuperación de una interrupción

Puede ocurrir que PostgreSQL confirme un cambio y el proceso se detenga antes de reemplazar el JSON. `PublicationState` conserva la revisión nueva y la copia mantiene la anterior.

Al arrancar, `recoverPublication` detecta esa diferencia y exporta los recursos pendientes. Se invalida y precarga antes de marcar el contenedor saludable. También se conserva un conjunto en memoria para reintentar publicaciones fallidas cuando se repite una operación apropiada durante el mismo proceso.

## Prueba registrada

El verificador, limitado a una base cuyo nombre termina en `_test`, confirmó un cambio de producto y su revisión sin publicar el archivo. Comprobó que el nombre nuevo no aparecía antes de recuperar, reinició el contenedor temporal y verificó el cambio y cero consultas públicas posteriores.

El informe muestra `HIT` para rutas existentes. Un slug inventado respondió 404 con `MISS`, pero tampoco consultó las tablas públicas: un fallo de caché HTML no implica una consulta SQL.

- [Arranque](../../scripts/start.mjs).
- [Manifiesto y solicitudes](../../src/lib/prewarm.ts).
- [Verificador de recuperación](../../scripts/verify-publication-recovery.mjs).
- [Resultado](../publication-recovery.json).
