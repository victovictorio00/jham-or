# Publicación estática y consultas — 5 de noviembre de 2026

La tienda pública usa HTML estático de Next.js y una copia publicada del contenido. La navegación no lee tablas comerciales, tampoco al abrir una búsqueda nueva o una ficha que no estaba en la caché. La búsqueda, los filtros, el orden y la paginación del catálogo funcionan en el navegador sobre sus tarjetas públicas.

## Cuándo se lee PostgreSQL

- Al preparar una publicación, después de editar muebles, categorías, portada o páginas desde el panel.
- Al comprar o cancelar con cambios de stock: la comprobación y el descuento/reposición siguen siendo transaccionales.
- Para comprobar sesiones, permisos y datos privados en cuenta y administración.
- En los healthchecks (`SELECT 1`) y en una lectura pequeña de revisiones al arrancar el servidor. Esa lectura recupera una publicación si el proceso se interrumpió después de confirmar el cambio en PostgreSQL.

No hay un temporizador de cinco minutos que vuelva a consultar el catálogo. No hay polling de contenido público. Abrir o recargar la web no lee Product, Category, Setting, Page o PublicationState.

## Cómo se publica

1. La misma transacción que modifica datos públicos cambia la revisión de `PublicationState` del recurso afectado.
2. Se leen únicamente los datos públicos de ese recurso, con una vista consistente de PostgreSQL.
3. Se sustituye atómicamente `/app/publication/store.json` en el volumen `jhamor_publication`. La copia contiene productos públicos, categorías activas, páginas publicadas y configuración pública; no incluye usuarios, sesiones, pedidos ni contraseñas.
4. Se invalida la etiqueta correspondiente de Next.js. Los guardados sin cambios no escriben revisiones ni invalidan la publicación.
5. Después de responder, la aplicación precarga las páginas e imágenes afectadas por HTTP interno. Las visitas también pueden regenerar HTML desde esa copia, sin volver a consultar la base de datos.

Los cupones, datos de clientes, roles y cambios de pago no regeneran el catálogo. Las compras de fabricación a pedido tampoco lo regeneran si no alteran existencias.

## Arranque y recuperación

La imagen Docker lleva una copia pública inicial para generar HTML durante la compilación, sin credenciales ni acceso a PostgreSQL. Al arrancar, solo se utiliza esa copia inicial si no existe la publicación persistida.

El proceso comprueba las revisiones de publicación, recupera las pendientes, invalida los artefactos de arranque y precarga todas las páginas públicas y variantes principales de imágenes antes de quedar saludable. Las imágenes optimizadas se conservan en `jhamor_image_cache`. La publicación se conserva en `jhamor_publication`.

Se probó el caso de interrupción: un cambio y su revisión se confirmaron en la base de pruebas sin publicar el archivo. Tras reiniciar el contenedor, se recuperó el cambio y las visitas siguientes hicieron cero consultas de contenido. Ver [publication-recovery.json](publication-recovery.json).

## Desarrollo y despliegue

Trabaja desde `/home/sistemas/jham-or`. Prepara una copia inicial después de migrar y cargar los datos:

```bash
export PATH="$PWD/node_modules/node/bin:$PATH"
npm run db:migrate
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/export-publication.ts
npm run build
```

`scripts/deploy.sh` ejecuta la migración, exporta la copia para la compilación, construye la imagen, espera la precarga y recarga Nginx. La copia de compilación `var/publication.json` es un artefacto público generado, excluido de Git. Los secretos siguen excluidos de Git y de la imagen.

Una modificación directa mediante SQL no es una publicación. Para cambios comerciales usa el panel. Si una importación escribe por SQL, debe actualizar la revisión de cada recurso afectado en la misma transacción; el servicio podrá recuperar y publicar ese cambio. No es necesario consultar periódicamente las tablas para detectar modificaciones.

El archivo publicado y PostgreSQL deben respaldarse junto con los archivos subidos. El script de copias incluye los tres. Los registros y copias locales están dentro de `var/`, no en la raíz de `/home/sistemas`.
