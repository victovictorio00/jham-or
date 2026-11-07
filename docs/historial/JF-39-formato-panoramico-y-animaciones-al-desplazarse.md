# JF-39 — Formato panorámico y animaciones al desplazarse

- **Identificador:** JF-39
- **Fecha de documentación:** 2026-11-07
- **Tipo:** diseño público, imágenes de portada y experiencia de navegación.

## Solicitud y límites de productos

El usuario preguntó cuántos productos aparecen en la web principal y cuándo existen más páginas. También pidió un formato concreto para el carrusel y animaciones de entrada al bajar por la web con mouse o móvil.

La portada selecciona hasta seis productos, priorizando destacados, y enlaza a la colección completa. No se añade paginación a esa selección editorial. El catálogo muestra 24 por página: el producto 25 inicia la segunda y el 49 inicia la tercera. Los filtros de categoría, búsqueda y orden se aplican antes de separar las páginas. Estos límites existentes no cambian.

Las referencias son [portada](../../src/app/(store)/page.tsx), [catálogo público](../../src/components/catalog.tsx) y [catálogo publicado](../../src/lib/catalog.ts). La lectura sigue utilizando la publicación persistida, sin consultar PostgreSQL al navegar o filtrar.

## Marco del carrusel

[storefront.css](../../src/app/storefront.css) sustituye alturas diferentes según dispositivo por una relación de aspecto constante de 16:7. Se mantiene en escritorio y móvil, por lo que se puede preparar una única composición panorámica sin cambiar el encuadre entre dispositivos.

Las imágenes utilizan `object-fit: contain`: conservan sus proporciones y se ven completas. Si la fotografía no coincide con el marco, aparecen márgenes del color de fondo. No se estiran ni se cortan automáticamente para llenar el espacio. Las fotografías ya guardadas siguen siendo utilizables.

La recomendación para ocupar completamente el marco es 1920 × 840 píxeles. No se impone una eliminación o un reemplazo de las fotos existentes, ni se bloquea guardar una fotografía diferente: se informa del resultado previsto y se muestra una vista previa fiel.

## Ayuda de edición y vista previa

[image-list-editor.tsx](../../src/components/image-list-editor.tsx) incorpora un modo panorámico exclusivo del carrusel. Muestra la recomendación de dimensiones, explica los márgenes y presenta cada foto en el mismo marco 16:7, sin el recorte de la miniatura genérica de biblioteca.

La proporción se comprueba al cargar la vista previa optimizada. Si difiere más de un ocho por ciento de 16:7, aparece un aviso en esa foto indicando que se mostrará con márgenes. La comprobación se realiza en el navegador y no añade llamadas a la API o a PostgreSQL. No se afirma conocer la resolución original a partir de una miniatura optimizada.

[admin.tsx](../../src/components/admin.tsx) activa ese modo para Carrusel de portada. Las fotos de variantes y las demás listas de imágenes conservan sus controles habituales. Las reglas visuales del editor están en [globals.css](../../src/app/globals.css).

## Entrada al desplazarse

[scroll-reveal.tsx](../../src/components/scroll-reveal.tsx) utiliza un solo IntersectionObserver para detectar tarjetas de producto, categorías, encabezados y bloques editoriales que entran en pantalla. Se anima una única entrada de opacidad y desplazamiento corto, con una escala discreta. El escalonado por columnas tiene retardos de 0, 85 o 170 ms y cada entrada dura 850 ms.

Se utiliza Web Animations API, sin instalar bibliotecas ni escuchar cada evento de scroll. Las animaciones terminadas se retiran del conjunto activo. El observador deja de seguir cada elemento después de su entrada y se desconecta al cambiar de ruta.

Un MutationObserver limitado a nodos añadidos permite detectar resultados nuevos del catálogo sin recorrer toda la página al cambiar un texto de precio o una miniatura. Un WeakSet evita observar repetidamente las mismas tarjetas. No se realizan peticiones de datos para animar.

La integración está limitada al [layout de tienda](../../src/app/(store)/layout.tsx); no cambia el panel administrativo. También se suaviza el acercamiento de las fotografías al pasar el mouse, con reglas exclusivas de punteros que admiten hover.

## Contenido visible y accesibilidad

El HTML permanece visible sin JavaScript o si faltan las APIs de animación. No se ocultan todas las tarjetas con una clase global a la espera de que cargue un script.

La preferencia del sistema de movimiento reducido impide iniciar las entradas y cancela las activas si se habilita durante la visita. Las fotos y enlaces permanecen utilizables. Los gestos y controles del carrusel de JF-37 y la retirada del contador de JF-38 se conservan.

## Validación y evidencias

[verify-scroll-format.mjs](../../scripts/verify-scroll-format.mjs) comprueba el marco en escritorio y móvil, el ajuste de imagen sin recortes, hasta seis productos de portada, entradas de productos al desplazarse, ausencia de desbordamiento, contenido sin JavaScript, movimiento reducido y guía/vista previa administrativa. Registra peticiones API durante el desplazamiento y errores JavaScript.

Las ejecuciones reales, la imagen desplegada y las capturas se describen en [VERIFICATION.md](../VERIFICATION.md). Las comprobaciones no crean productos ni pedidos. No se añaden dependencias, migraciones ni consultas comerciales.

Antecedentes: [JF-30](JF-30-diseno-editorial-e-identidad-visual.md), [JF-34](JF-34-carrusel-y-accesos-rapidos-del-catalogo.md), [JF-37](JF-37-carrusel-automatico-y-arrastre-con-el-mouse.md) y [JF-38](JF-38-retirada-del-contador-del-carrusel.md).
