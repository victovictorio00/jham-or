# JF-12 — Imágenes, fotografías y biblioteca multimedia

- **Identificador:** JF-12
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; precarga persistente añadida en 0614d4d.

## Fotografías iniciales

Se descargaron fotografías de referencia de Unsplash a `public/images`. La lista de fuentes se conserva en `docs/ASSETS.md`. Estas fotos permiten revisar el diseño, pero no acreditan que los muebles representados pertenezcan al catálogo real de Jham-or.

La descarga local evita una petición a Unsplash durante cada navegación. Deben reemplazarse por fotografías autorizadas y correspondientes a los productos que se vendan.

## Subidas desde administración

El endpoint de subida exige permisos administrativos y aplica un límite de intentos. Admite un archivo de hasta 5 MB y limita su decodificación a 25 millones de píxeles.

sharp realiza la decodificación, orientación, redimensionado dentro de 1600 × 1600 sin ampliación y conversión a WebP con calidad configurada de 82. El nombre final es un UUID con extensión `.webp`.

El registro `Media` conserva nombre original acotado, nombre/alt editables, URL, dimensiones y tamaño resultante. Los bytes van al directorio de subidas; no se almacenan como una columna binaria en PostgreSQL.

## Entrega y seguridad de rutas

`/media/[name]` solo acepta el patrón de nombre UUID y extensión WebP previsto. Construye la ruta dentro del directorio configurado y devuelve 404 si el archivo no existe o el nombre no es válido.

Las imágenes correctas llevan tipo `image/webp` y caché larga inmutable. Cada nueva subida usa una URL nueva, en lugar de sustituir silenciosamente los bytes de otra imagen con esa misma URL.

## Biblioteca y uso

Se pueden editar título y texto alternativo y copiar la ruta. Los productos admiten imagen principal y hasta diez fotos de galería. Portada y categorías también pueden utilizar imágenes de la biblioteca.

La implementación conserva imágenes para no romper referencias históricas. No ofrece una eliminación física general con cálculo completo de referencias y recuperación de espacio.

## Variantes de Next.js y precarga

Next adapta las imágenes al tamaño utilizado en la página. La precarga prepara anchos de 360 y 640 px para las fuentes principales, y añade 1440 px para la portada. No promete precargar todos los anchos posibles ni todas las galerías.

La caché de variantes se conserva en `jhamor_image_cache`, separada de los originales/subidas en `jhamor_uploads`.

## Verificación

Se comprobó una subida válida, el tipo WebP y su lectura posterior. Durante el desarrollo, una imagen PNG de prueba resultó corrupta: el rechazo era correcto y el fixture se sustituyó por un PNG válido generado para la prueba.

- [Fuentes de fotografías](../ASSETS.md).
- [Endpoint de medios](<../../src/app/media/[name]/route.ts>).
- [Biblioteca y editores](../../src/components/admin.tsx).
- [Precarga](../../src/lib/prewarm.ts).
