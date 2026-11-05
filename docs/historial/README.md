# Historial detallado de Jham-or

Esta carpeta conserva la evolución del proyecto desde su creación: requisitos, tecnologías, decisiones, funcionalidades, correcciones, infraestructura y verificaciones. Todos sus archivos son Markdown.

Los registros usan nombres descriptivos como `JF-02-tecnologias-y-motivos.md`. El encabezado interior conserva el mismo identificador. Los números son estables y no se reutilizan.

## Alcance y fuentes

La primera serie **JF-01 a JF-23** es una reconstrucción retrospectiva contrastada con el código, el lockfile, las migraciones, los commits y los informes conservados. **JF-24** registra la incorporación de esta documentación y las reglas para continuarla.

Los documentos se separan por temas para facilitar la consulta. No representan 24 commits originales ni implican que se hubiera creado un Markdown al programar cada primera funcionalidad. La cronología precisa de los commits disponibles está en [JF-21](JF-21-cronologia-de-commits-y-correcciones.md).

Fecha de esta serie documental: **5 de noviembre de 2026**. Referencia del código examinado antes de añadir la carpeta: `0614d4d`.

## Índice

| Identificador | Documento | Qué permite consultar |
| --- | --- | --- |
| JF-01 | [Creación del proyecto y alcance original](JF-01-creacion-del-proyecto.md) | Solicitud inicial, alcance y relación con Auriel. |
| JF-02 | [Tecnologías utilizadas y motivos de elección](JF-02-tecnologias-y-motivos.md) | Versiones resueltas, responsabilidad y motivo de cada tecnología. |
| JF-03 | [Arquitectura de la aplicación y mapa de archivos](JF-03-arquitectura-y-estructura.md) | Separación público/privado y mapa del repositorio. |
| JF-04 | [Base de datos, importes y migraciones](JF-04-base-de-datos-y-migraciones.md) | Tablas, relaciones, importes, índices, seed y migraciones. |
| JF-05 | [Diseño visual, adaptación y retirada de la franja superior](JF-05-diseno-visual-y-franja-superior.md) | Presentación, adaptación móvil y eliminación de la franja verde. |
| JF-06 | [Catálogo, categorías y fichas de muebles](JF-06-catalogo-y-fichas-de-muebles.md) | Datos de muebles, disponibilidad, fichas y filtros. |
| JF-07 | [Cuentas, sesiones y permisos de acceso](JF-07-cuentas-sesiones-y-permisos.md) | Registro, sesiones, cookies, perfil y roles. |
| JF-08 | [Bolsa persistente y proceso de compra](JF-08-bolsa-checkout-y-experiencia-de-compra.md) | Bolsa local, paso por acceso y confirmación del pedido. |
| JF-09 | [Pedidos, inventario concurrente e idempotencia](JF-09-pedidos-inventario-e-idempotencia.md) | Transacciones, stock, reintentos, estados y cancelación. |
| JF-10 | [Panel de administración y herramientas comerciales](JF-10-panel-de-administracion.md) | Secciones del panel, listados, edición y auditoría. |
| JF-11 | [Contenido editable, configuración y SEO](JF-11-contenido-configuracion-y-seo.md) | Portada, páginas, borradores, metadatos y sitemap. |
| JF-12 | [Imágenes, fotografías y biblioteca multimedia](JF-12-imagenes-y-biblioteca-multimedia.md) | Fotos de muestra, subidas, WebP y variantes. |
| JF-13 | [Cupones, pagos coordinados y modalidades de entrega](JF-13-cupones-pagos-y-entregas.md) | Cotización, descuentos, pago manual y entrega. |
| JF-14 | [Seguridad aplicada y revisión de dependencias](JF-14-seguridad-y-dependencias.md) | Controles reales, revisión de dependencias y secretos. |
| JF-15 | [Despliegue con Docker, Nginx y HTTPS](JF-15-despliegue-docker-nginx-y-https.md) | Servicios, red, imagen Docker, proxy y certificado. |
| JF-16 | [Caché inicial y corrección de guardados sin cambios](JF-16-cache-inicial-y-guardados-sin-cambios.md) | Caché inicial y corrección de escrituras sin cambios. |
| JF-17 | [Publicación estática y eliminación de SQL público por visita](JF-17-publicacion-estatica-y-consultas.md) | Copia publicada, revisiones e invalidación selectiva. |
| JF-18 | [Precarga interna, arranque y recuperación de publicaciones](JF-18-precarga-arranque-y-recuperacion.md) | Precarga interna, salud y recuperación tras reiniciar. |
| JF-19 | [Migración al repositorio jham-or y organización de archivos](JF-19-migracion-y-organizacion-del-repositorio.md) | Traslado al repositorio nuevo y conservación del historial. |
| JF-20 | [Pruebas funcionales y mediciones de rendimiento](JF-20-pruebas-y-mediciones-de-rendimiento.md) | Casos de prueba, SQL, HTTP y muestra móvil. |
| JF-21 | [Cronología de commits y correcciones realizadas](JF-21-cronologia-de-commits-y-correcciones.md) | Commits en orden temporal e incidencias corregidas. |
| JF-22 | [Copias de seguridad, salud y mantenimiento](JF-22-copias-de-seguridad-y-mantenimiento.md) | Volúmenes, copias, programación y limpieza. |
| JF-23 | [Alcance actual, limitaciones y datos pendientes](JF-23-alcance-actual-y-pendientes.md) | Lo implementado, datos de muestra y funciones pendientes. |
| JF-24 | [Documentación histórica y registro de futuros cambios](JF-24-documentacion-y-registro-de-futuros-cambios.md) | Esta incorporación, plantilla y procedimiento de continuidad. |

## Rutas de lectura sugeridas

- **Para entender el proyecto:** JF-01, JF-02 y JF-03.
- **Para administrar la tienda:** JF-06 a JF-13 y la [guía del panel](../ADMIN.md).
- **Para mantener o desplegar:** JF-04, JF-14 a JF-18 y JF-22.
- **Para conocer qué cambió y qué falta:** JF-19 a JF-23.
- **Antes de realizar otro cambio:** JF-24 y [AGENTS.md](../../AGENTS.md).

## Cómo continuar el historial

El próximo número disponible es **JF-25**. Crea `JF-25-titulo-descriptivo.md`, explica el cambio con sus motivos y evidencias y añade su fila a este índice. No renumeres los documentos existentes para insertar un tema nuevo.

Una evolución posterior se documenta con otro número y un enlace al antecedente. Los datos comerciales del panel mantienen su auditoría en la aplicación; no se ha instalado un generador automático de Markdown por cada producto editado.

## Evidencias y privacidad

Los enlaces al código y a los informes permiten comprobar el contenido. Las pruebas y métricas describen ejecuciones históricas; solo se actualizan como nuevas mediciones si realmente se vuelven a ejecutar. Una muestra sintética no se convierte en una garantía para todas las redes.

Los registros técnicos locales y las copias están en `var/`, excluidos de Git. Esta carpeta no contiene credenciales ni datos privados de clientes. Los informes JSON y capturas ya existentes se enlazan desde aquí; no se han convertido en archivos adicionales que incumplan el formato Markdown de esta carpeta.

[Volver al README del proyecto](../../README.md).
