# JF-30 — Diseño editorial e identidad visual de la tienda

- **Identificador:** JF-30
- **Fecha de documentación:** 2026-11-06
- **Tipo:** diseño y presentación pública.

## Solicitud y punto de partida

El usuario pidió una web más elegante, moderna, formal y visualmente cuidada, con una paleta adecuada y una composición que fuera más allá de cambiar colores. La tienda anterior utilizaba verde, tipografías de sistema, una imagen de portada a toda anchura con texto superpuesto y colecciones de altura uniforme.

El trabajo conserva la marca Jham-or, el dominio, el contenido editable y los flujos comerciales existentes. No se cambian precios, datos de clientes, permisos ni condiciones de compra.

## Dirección visual y decisiones

La nueva identidad utiliza marfil `#f8f5ef`, nogal oscuro `#302923` y bronce `#8d6e4b`. El fondo cálido y las líneas discretas organizan la página; el contraste oscuro se utiliza para lectura y acciones, y el bronce para acentos. No se recupera la franja de anuncios retirada anteriormente.

Cormorant Garamond aporta titulares editoriales y cursivas; Manrope se usa para navegación, formularios y textos de apoyo. Son tres archivos WOFF2 latinos, aproximadamente 86 KB en total, con licencias OFL conservadas junto a los archivos. `next/font/local` los sirve desde el propio dominio con `display: swap`, sin solicitudes del visitante a Google. La carga se declara en el layout público para que el panel administrativo no descargue tipografías que no utiliza.

## Composición de la portada

- Portada dividida entre texto y fotografía, con el título editable, una última línea en cursiva, una llamada principal a la colección y un pequeño sello tipográfico de marca.
- Fotografía más limpia, con nota inferior y referencia editorial lateral. Conserva la imagen configurada por el administrador, carga prioritaria y dimensiones responsivas.
- Beneficios discretos debajo de la portada, sin convertirlos en una franja de anuncios.
- Categorías con fotografías separadas de sus títulos, numeración y una disposición escalonada en escritorio. En móvil se presentan completas en una columna.
- Selección de productos con mejor jerarquía entre categoría, nombre y precio, líneas de separación y acceso visible mediante una flecha. Se priorizan los destacados en la portada sin alterar el orden del catálogo general.
- Bloque de esencia con fotografía, monograma y tratamiento editorial; nueva sección de principios de diseño y cierre en nogal con llamada a conversar.
- Pie de página en tonos claros, con un titular de marca, enlaces y canales configurados en la tienda.

## Alcance y archivos

[storefront.css](../../src/app/storefront.css) limita la nueva identidad a `.storefront`. También adapta catálogo, ficha, contacto, esencia, acceso, formularios y pie de página. No modifica los colores ni los tamaños del panel para conseguir el rediseño público.

[Portada](../../src/app/(store)/page.tsx) y [layout público](../../src/app/(store)/layout.tsx) contienen la nueva composición. [shop.tsx](../../src/components/shop.tsx) actualiza la firma bajo la marca del encabezado. Los archivos de fuente y sus licencias están en `public/fonts/`. El favicon tipográfico de [icon.svg](../../public/icon.svg) adopta el nogal y el marfil para mantener la identidad también en la pestaña del navegador.

Se reutilizan las fotografías existentes. No se incorporan vídeos, carruseles automáticos, librerías de animación ni peticiones para cargar contenido que ya está publicado. Los enlaces y las acciones conservan su comportamiento comercial.

## Adaptación, accesibilidad y rendimiento

La portada cambia a una composición vertical en tablet y móvil; los productos mantienen dos columnas en teléfono. Se verifican tamaños de 360, 390, 768, 1024 y 1440 píxeles. Los controles conservan sus etiquetas, el menú móvil y el salto al contenido. Las transiciones respetan `prefers-reduced-motion`.

Las imágenes siguen usando Next Image con `sizes` acordes a la composición. Solo la fotografía principal tiene prioridad en portada. El catálogo continúa leyendo la publicación persistida; el diseño no añade consultas de base de datos ni nueva lógica de autenticación.

## Validación y evidencias

[verify-design.mjs](../../scripts/verify-design.mjs) visita siete rutas en cinco anchos, comprueba respuesta, un único título principal, ausencia de desbordamiento y errores JavaScript, y registra las solicitudes externas. Genera capturas de portada, catálogo y ficha en móvil y escritorio sobre la base de prueba.

Los resultados ejecutados, la imagen desplegada y la medición SQL se registran en [verificación](../VERIFICATION.md) y [reporte visual](../design-verification.json). Antecedentes: [JF-05](JF-05-diseno-visual-y-franja-superior.md) y [JF-28](JF-28-consultas-y-cache-de-administracion.md). La funcionalidad de arrastre y la nueva vía rápida de imágenes se documentan por separado en [JF-31](JF-31-arrastre-de-grupos-y-subida-sin-recompresion.md).

## Resultado observado

El verificador visual completó las 35 vistas sin desbordamiento, errores JavaScript o peticiones a otros dominios. Se revisaron las capturas de portada, catálogo y ficha y se mantuvieron las comprobaciones de menú móvil y compra en la suite de 16 pruebas. TypeScript y las 10 pruebas unitarias también terminaron correctamente.

Las capturas se realizaron con datos sintéticos de QA. La comprobación de publicación y continuidad de consultas se incorpora al informe de esta entrega; no se presenta como una validación nueva de las métricas históricas anteriores.

## Comprobación del despliegue

La imagen final quedó saludable después de una copia de seguridad. El [verificador de producción](../../scripts/verify-editorial-production.mjs) confirmó el diseño y la selección acumulativa de tres fotos sin llamar al endpoint de subida ni escribir imágenes de prueba. Se conservan los resultados en [editorial-production-verification.json](../editorial-production-verification.json).

La comprobación pública de esta entrega completó 105 respuestas HTML con cero consultas SQL públicas adicionales. El informe de [verificación](../VERIFICATION.md) identifica la imagen y la diferencia final del favicon respecto a la imagen probada en QA.
