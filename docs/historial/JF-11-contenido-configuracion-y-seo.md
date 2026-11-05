# JF-11 — Contenido editable, configuración y SEO

- **Identificador:** JF-11
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; publicación estática e invalidación en 0614d4d.

## Configuración de tienda

La clave `store` del modelo `Setting` conserva los datos públicos de la tienda. El editor permite cambiar marca, lema, título y texto de portada, imagen principal, historia, pie de página, contacto, horario, dirección, cobertura, tarifa de envío, recojo e Instagram.

Los valores por defecto permiten iniciar el proyecto con una presentación revisable. No deben confundirse con información comercial definitiva del negocio.

## Páginas informativas

`Page` contiene título, slug, texto, descripción SEO y estado de publicación. Un borrador no se incluye en la copia pública. Retirar una página elimina su disponibilidad pública cuando se actualiza la publicación.

El contenido se muestra como texto con saltos de línea. No es un editor que ejecute HTML arbitrario. Este alcance facilita la edición y mantiene la representación controlada.

Las páginas iniciales son Términos, Privacidad y Envíos. Sus textos indican que faltan los datos y condiciones definitivas del negocio. El proyecto no certifica una revisión legal de esos contenidos.

## SEO implementado

- Metadatos generales y URL base en el layout raíz.
- Título y descripción para fichas de producto.
- Imagen de producto para la presentación social configurada.
- Título y descripción SEO de páginas informativas.
- Sitemap con productos y páginas publicadas.
- Reglas de `robots` que excluyen rutas privadas y operativas.
- Favicon de la marca.

Las exclusiones de robots orientan a buscadores; no sustituyen a la autorización del servidor.

## Actualización del contenido

Guardar ajustes actualiza su revisión `settings`; editar una página utiliza `pages`. La copia pública y los artefactos afectados se actualizan por publicación, no por un sondeo periódico de tablas.

Cambiar un slug cambia la URL. La invalidación por patrón de páginas y fichas evita conservar únicamente la ruta anterior. No se ha añadido una tabla de redirecciones editoriales automáticas entre todos los slugs antiguos y nuevos.

## Elementos cuyo alcance sigue siendo específico

El layout raíz y partes del panel contienen textos y metadatos de Jham-or en código. La existencia de un campo de marca editable no convierte toda la aplicación en un generador de tiendas con identidad completamente intercambiable.

El antiguo campo de anuncio permanece en algunos datos por compatibilidad, pero su franja no se muestra.

- [Metadatos raíz](../../src/app/layout.tsx).
- [Sitemap](../../src/app/sitemap.ts).
- [Robots](../../src/app/robots.ts).
- [Páginas de contenido](<../../src/app/(store)/paginas/[slug]/page.tsx>).
