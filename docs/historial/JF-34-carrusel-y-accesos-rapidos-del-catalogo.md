# JF-34 — Carrusel y accesos rápidos del catálogo

- **Identificador:** JF-34
- **Fecha de documentación:** 2026-11-06
- **Tipo:** navegación pública, portada y herramientas de diseño.

## Solicitud

El usuario pidió que Colección, Sala y las demás secciones mostraran miniaturas como acceso rápido al pasar el ratón: como máximo las seis primeras piezas, sin rellenar huecos cuando existan menos. También pidió sustituir la portada dividida entre texto y fotografía por un carrusel que se edite desde el panel mediante imágenes.

## Navegación por colecciones

[catalog.ts](../../src/lib/catalog.ts) prepara los grupos a partir de la publicación persistida. Colección incluye las primeras seis piezas visibles; cada categoría activa incluye hasta seis piezas de esa categoría. Se entrega al encabezado únicamente la información necesaria de esos accesos, en lugar de todo el catálogo. El orden es el mismo de la publicación: destacados y fecha de creación, con desempate estable.

[store-navigation.tsx](../../src/components/store-navigation.tsx) abre el panel al pasar por una sección y permite avanzar con el puntero a las miniaturas sin cerrarlo. Cada fotografía enlaza con la ficha y muestra nombre y precio. Una categoría con una pieza muestra una; una categoría vacía muestra un mensaje, sin inventar piezas ni duplicar miniaturas.

Se conservan los enlaces directos de las categorías. El botón contiguo abre o cierra sus accesos con teclado o mediante toque. Escape y el clic exterior permiten cerrarlos. En móvil los accesos forman parte del menú desplegado, se adaptan a dos o tres columnas y se pueden recorrer sin depender del hover.

Abrir un grupo no realiza una petición a la API ni a PostgreSQL. Las miniaturas se solicitan al optimizador local de imágenes cuando se necesitan. La caché del grupo usa la etiqueta del catálogo y se invalida al publicar un cambio comercial.

## Carrusel de portada

[home-carousel.tsx](../../src/components/home-carousel.tsx) presenta fotografías a toda anchura, sin texto comercial superpuesto ni columna lateral. Admite entre una y ocho imágenes. Con una imagen no muestra controles innecesarios. Con varias aparecen anterior, siguiente, indicadores y control de pausa; también se puede deslizar en una pantalla táctil o utilizar las flechas del teclado desde el componente.

El cambio automático se realiza cada seis segundos, se pausa al situar el puntero o el foco dentro, al ocultar la pestaña o mediante el botón de pausa. Se respeta la preferencia de movimiento reducido. Se prioriza la primera fotografía y se prepara la siguiente después de cargar la inicial, evitando pedir todas las imágenes grandes al abrir la página.

La portada mantiene un título principal accesible y visible en la sección siguiente. Se conserva el estilo editorial en el resto de la página. Los campos antiguos de título y descripción de portada permanecen en los datos para compatibilidad, pero ya no se ofrecen como textos del carrusel.

## Edición en el panel

En Diseño y tienda, Carrusel de portada permite añadir fotos de la biblioteca, verlas, reordenarlas mediante botones y quitarlas de la selección. Solo se editan las imágenes y su orden. [image-list-editor.tsx](../../src/components/image-list-editor.tsx) es el control compartido para estas listas y para las fotos de variantes.

La barra de biblioteca del editor permite abrir la subida en otra pestaña y actualizar las opciones con una única petición específica, conservando lo escrito. Se valida que el carrusel no quede vacío, que no supere ocho fotos y que todas las imágenes subidas sigan existiendo al guardar. El campo heredado `heroImage` se sincroniza con la primera fotografía para no conservar referencias obsoletas.

Las tiendas con configuración anterior conservan su portada como primera fotografía, acompañada por imágenes de muestra existentes. El administrador puede reemplazar esa selección. No se añaden columnas a Setting: `heroImages` se almacena en el JSON de la configuración. La precarga conoce las fotografías del carrusel y evita continuar trabajos de una publicación ya sustituida.

## Consistencia de las páginas publicadas

Los accesos rápidos forman parte del layout compartido. Al cambiar el catálogo, [publish-runtime.ts](../../src/lib/publish-runtime.ts) invalida también ese layout, además de las fichas y las etiquetas de datos. Esto incluye rutas previamente generadas de productos retirados y actualiza el encabezado de las demás páginas. La regeneración solo se solicita tras una modificación; no introduce consultas SQL en las visitas públicas.

[prewarm.ts](../../src/lib/prewarm.ts) abandona las siguientes rutas de un trabajo si detecta otra revisión y evita atribuir errores de una publicación sustituida a la versión vigente. La nueva publicación se precarga en segundo plano.

## Archivos y validación

Cambian [layout público](../../src/app/(store)/layout.tsx), [portada](../../src/app/(store)/page.tsx), [shared.ts](../../src/lib/shared.ts), [publicación](../../src/lib/publication.ts), [lectura publicada](../../src/lib/published.ts), [validación](../../src/lib/validation.ts), [editor](../../src/components/admin.tsx), estilos y [precarga](../../src/lib/prewarm.ts).

[collection-experience.spec.ts](../../tests/e2e/collection-experience.spec.ts) cambia y reordena el carrusel desde la interfaz, comprueba los controles, el máximo de seis accesos, una categoría con un único producto y la navegación táctil. La prueba de publicación verifica cambios de fotografías en lugar del antiguo titular. Los verificadores SQL incluyen ahora ProductVariant para que la medición cubra los nuevos datos.

Los resultados ejecutados y las capturas se reúnen en [verificación](../VERIFICATION.md). Antecedentes: [JF-30](JF-30-diseno-editorial-e-identidad-visual.md), [JF-33](JF-33-selectores-con-busqueda-y-vistas-previas.md) y [JF-35](JF-35-variantes-con-precio-stock-y-galeria-propios.md).
