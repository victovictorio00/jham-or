# JF-06 — Catálogo, categorías y fichas de muebles

- **Identificador:** JF-06
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; filtros sobre publicación en 0614d4d.

## Información de cada mueble

La ficha contiene nombre, slug, SKU, descripción, categoría, precio, oferta opcional, imagen principal, galería, material, medidas, acabados, plazo estimado, stock, fabricación a pedido, visibilidad y destacado.

Se añadieron estos datos porque una compra de muebles requiere más contexto que una tarjeta con foto y precio. Las dimensiones y el acabado elegido también ayudan a coordinar la entrega y conservar la selección en el pedido.

## Disponibilidad

Un producto archivado o inactivo no se exporta públicamente. También se exige que su categoría esté activa. Un producto de stock controlado agotado conserva una ficha donde la compra se muestra deshabilitada. La fabricación a pedido puede ofrecerse con stock cero porque utiliza otra regla de inventario.

La venta definitiva comprueba de nuevo la disponibilidad. La información visible de una publicación no reserva unidades.

## Búsqueda y filtros

La URL conserva parámetros como `categoria`, `q`, `orden` y `pagina`. Los filtros actuales trabajan en el navegador sobre las tarjetas públicas:

- Categoría por slug.
- Búsqueda por nombre o material, sin distinguir mayúsculas.
- Orden destacado de la publicación, más recientes, menor o mayor precio.
- Paginación de 24 productos.

El orden por precio utiliza el precio de oferta cuando existe. Las tarjetas omiten descripción larga, galería y fecha de actualización; esas propiedades se necesitan en otros usos y permanecen en la copia del servidor.

## Cambio frente a la primera versión

Inicialmente cada combinación de búsqueda podía necesitar un lector SQL propio y la caché del catálogo se renovaba a los 300 segundos. La versión actual recibe las tarjetas de la publicación y resuelve los filtros localmente. Una búsqueda inédita tampoco introduce una consulta a PostgreSQL.

## Rutas y archivos

| Ruta | Comportamiento |
| --- | --- |
| `/productos` | Documento estático con el catálogo público y filtros interactivos. |
| `/productos/[slug]` | Ficha generada desde la publicación; los slugs nuevos pueden generarse al publicarse. |
| `/productos?categoria=sala` | Mismo catálogo público, filtrado en el navegador. |

- [Página de catálogo](<../../src/app/(store)/productos/page.tsx>).
- [Filtros](../../src/components/catalog.tsx).
- [Ficha](<../../src/app/(store)/productos/[slug]/page.tsx>).
- [Lectores públicos](../../src/lib/catalog.ts).
- [Publicación](JF-17-publicacion-estatica-y-consultas.md).

Las pruebas comprobaron filtros, orden, búsqueda sin resultados, fichas y publicación de productos nuevos y archivados.
