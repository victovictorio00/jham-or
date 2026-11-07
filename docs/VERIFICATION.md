# Formato panorámico y entradas al desplazarse — 7 de noviembre de 2026

La portada mantiene hasta seis productos seleccionados; la colección completa mantiene veinticuatro por página, con la segunda desde el producto 25 y la tercera desde el 49. Los filtros y la ordenación preceden a la paginación. Los límites se verificaron en el código existente y no se modificaron.

El carrusel usa un marco constante 16:7 en escritorio y móvil, con imágenes completas y proporcionadas. El panel recomienda 1920 × 840 px, muestra vistas previas con ese marco y avisa si una fotografía tendrá márgenes. No se obliga a sustituir fotografías existentes ni se recortan automáticamente. Las tarjetas y bloques editoriales incorporan entradas al desplazarse y acercamiento suave de fotos con hover.

Compilación de producción y TypeScript aprobados. El verificador específico pasó en QA y en el dominio real: seis productos de portada, proporción 2,286 en ambos tamaños, imágenes sin recorte, tarjetas animadas al entrar en pantalla, ausencia de desbordamiento, contenido visible sin JavaScript y movimiento reducido respetado. También revisó guía y vista previa del panel. El desplazamiento produjo **0 peticiones API** y no se detectaron errores JavaScript.

Tras desplegar se midieron **105 respuestas HTML públicas con 0 consultas SQL públicas adicionales**, incluyendo ProductVariant en el contador. No se repitieron las pruebas de compras para este cambio de presentación. La verificación no crea productos ni pedidos y solo abre una sesión propia para revisar el editor.

Imagen desplegada y saludable: `sha256:da7ee04223e7724a16adc56f446fedb3ef4b5721cc510c816de8336602741603`. No hay migraciones ni dependencias nuevas.

Evidencias: [comprobación de diseño](scroll-format-verification.json), [SQL/HTTP](performance.json), [productos en escritorio](scroll-products-desktop.png), [productos en móvil](scroll-products-mobile.png), [verificador](../scripts/verify-scroll-format.mjs) y [JF-39](historial/JF-39-formato-panoramico-y-animaciones-al-desplazarse.md). Los informes siguientes son antecedentes de sus respectivas entregas.

# Carrusel sin contador — 7 de noviembre de 2026

Retirado el texto numérico de posición y total de fotografías. Las flechas, indicadores, avance automático y arrastre se conservan.

Compilación de producción y TypeScript aprobados. En el dominio real se comprobó la ausencia del contador, los tres indicadores correspondientes a las imágenes actuales, el cambio de fotografía mediante la flecha siguiente y la ausencia de desbordamiento en móvil y errores JavaScript. La aplicación quedó saludable.

Imagen desplegada: `sha256:30483cbf3a3338ca9b8c4d03263d01858ca8ecace00081f8267f41b796d4f417`. No se modifican datos ni consultas y no se repiten las pruebas comerciales para esta retirada de texto.

Evidencias: [comprobación del dominio](carousel-no-counter-verification.json) y [JF-38](historial/JF-38-retirada-del-contador-del-carrusel.md). Los informes siguientes conservan los resultados de entregas anteriores.

# Carrusel automático y arrastre con el mouse — 7 de noviembre de 2026

Retirado el botón de pausa/reanudación. El carrusel avanza cada seis segundos y sigue funcionando con el mouse encima. Se puede arrastrar horizontalmente con mouse, lápiz o pantalla táctil. Las flechas e indicadores permanecen y una selección manual reinicia el intervalo.

Compilación de producción y TypeScript aprobados. El verificador específico pasó en QA y en `https://jhamor.purprum.com`: arrastre en ambos sentidos, movimiento pequeño sin cambio, avance automático con hover y después de hacer clic en una flecha, gesto táctil horizontal y gesto vertical sin cambiar la fotografía. También comprobó la preferencia de movimiento reducido, ausencia del botón de pausa, **0 peticiones API** y **0 errores JavaScript**. Las pruebas son de lectura; no crean datos comerciales.

Imagen desplegada: `sha256:a31194bb53b60a528134a0cadc2f47e976c2aa12a1c069e469c5ff8f33b6c699`. Aplicación saludable tras el despliegue. No se modifican consultas, esquema ni dependencias. Las mediciones SQL y las regresiones comerciales de la entrega anterior no se volvieron a ejecutar para este cambio de interacción.

Evidencias: [verificación del carrusel](carousel-drag-verification.json), [verificador](../scripts/verify-carousel-production.mjs) y [JF-37](historial/JF-37-carrusel-automatico-y-arrastre-con-el-mouse.md). Los informes siguientes corresponden a sus respectivas entregas anteriores.

# Carrusel, navegación y variantes independientes — 6 de noviembre de 2026

Publicados el carrusel de imágenes editable desde Diseño y tienda, los accesos rápidos de hasta seis productos por colección y las variantes con precio, stock y galería propios. Mi cuenta tiene una bienvenida amplia, accesos, pedidos y perfil adaptados a escritorio y móvil. Se retiró el bloque «Hagamos espacio para lo que importa / Tu próximo capítulo en casa» de la portada.

- **17 pruebas unitarias aprobadas**, en cuatro archivos; TypeScript y compilación Docker aprobados.
- **18 pruebas de navegador aprobadas** en la regresión completa, incluida la corrección de invalidación del layout al retirar productos. Después se redujo la selección de columnas de la consulta de cupones y se quitaron imports sin uso: sobre la imagen final se repitieron **tres pruebas afectadas**, todas aprobadas (experiencia completa de variantes y las dos de publicación).
- Variantes creadas desde el panel con fotos, precios y existencias diferentes. La bolsa las mantiene separadas; ficha y miniaturas cambian sin consultar la API. Compra concurrente de la última unidad, reintento idempotente y cancelación de una variante retirada comprobados en QA. El servidor ignora precios y nombres falsificados, calcula cupones con el importe de la variante y protege sus fotos referenciadas.
- En producción: carrusel y controles, navegación sin consultas API al pasar el mouse, editor de variantes con campos obligatorios y galería, Mi cuenta amplia y móvil sin desbordamiento. Menú administrativo contraíble, preferencia conservada, selección de imagen con **0 peticiones API** y actualización de biblioteca con **1**, sin perder lo escrito. Selección por arrastre y acumulación de grupos comprobadas sin subir archivos de prueba al servidor real.
- **105 respuestas HTML públicas: 0 consultas SQL públicas adicionales**, incluyendo ProductVariant en el contador. Medianas de 25,3 a 41,3 ms desde este servidor contra HTTPS; estas cifras describen esta muestra, no todas las conexiones de clientes.
- Siete pantallas administrativas medidas con cuatro visitas cada una: las tres visitas repetidas de cada pantalla realizaron **una consulta de sesión/permisos**, reutilizando los datos privados en caché. Mayor tiempo de esas visitas: 71,4 ms en esta muestra.
- Migración aditiva `20261106190000_product_variants` aplicada. Copias privadas previas completadas a las 22:23:15 y 22:46:10 UTC. No se reinició ni vació la base real, ni se crearon muebles, variantes o pedidos comerciales de prueba en producción. Aplicación y PostgreSQL saludables tras el despliegue.

Imagen final publicada y verificada: `sha256:1c175e4af7d2e2fa4705ff67a67cb13d6afc77dbd2ef476e772d3c1f28065603`.

Evidencias: [resumen de pruebas](collection-verification.json), [verificación del dominio](collection-production-verification.json), [administración](admin-production-verification.json), [diseño y selección por grupos](editorial-production-verification.json), [SQL/HTTP público](performance.json) y [medición administrativa](admin-collection-performance.json).

Capturas de QA con datos sintéticos: [portada](carousel-home.png), [accesos rápidos](navigation-quick-access.png), [variantes y galerías](product-independent-variants.png), [Mi cuenta](account-dashboard.png), [cuenta móvil](account-dashboard-mobile.png) y [pedidos en móvil](account-orders-mobile.png). La compra y las variantes completas se prueban en la base aislada; la comprobación de producción inspecciona formularios sin guardarlos y no crea registros comerciales.

Documentación detallada: [JF-34](historial/JF-34-carrusel-y-accesos-rapidos-del-catalogo.md), [JF-35](historial/JF-35-variantes-con-precio-stock-y-galeria-propios.md) y [JF-36](historial/JF-36-mi-cuenta-amplia-y-cierre-de-portada.md). Las mediciones siguientes se conservan como antecedentes.

# Creación, campos obligatorios y selectores — 6 de noviembre de 2026

Corregida la creación desde Clientes y la autorización para que administradores creen cuentas de cliente. La creación o modificación de cuentas del equipo continúa reservada al propietario. El resto de los formularios de creación se ha comprobado de extremo a extremo.

Los campos obligatorios muestran (*) y una leyenda. El enlace se propone al crear, las contraseñas iniciales se distinguen de las opcionales al editar y los errores se muestran junto a su campo sin perder los valores introducidos. Los nombres accesibles de los controles se conservan sin añadir el asterisco.

Los desplegables tienen un diseño compartido, búsqueda local en listas largas, miniaturas de imágenes y manejo con teclado. La lista se sitúa dentro de la pantalla y su buscador toma el foco sin desplazar ni cerrar el menú.

- TypeScript y **13 pruebas unitarias aprobadas**.
- **17 pruebas de navegador aprobadas**: creación de muebles, categorías, páginas, cupones, clientes y equipo; errores, corrección y reintento; permisos; búsqueda y teclado; móvil; compra, stock, imágenes y publicación.
- En el dominio real: formulario nuevo de cliente accesible, contraseña inicial obligatoria, asteriscos presentes, listas diseñadas y con miniaturas, búsqueda local y adaptación móvil.
- Abrir o buscar en el selector de imágenes: **0 peticiones API**. Intentar guardar una creación vacía: **0 peticiones API** y mensajes de campos obligatorios.
- Comprobación del selector de portada: 0 peticiones API al elegir y 1 al actualizar la biblioteca, sin errores JavaScript ni pérdida del formulario.
- 105 respuestas HTML públicas comprobadas tras desplegar: **0 consultas SQL públicas adicionales**.
- Copia de seguridad previa completada y aplicación saludable. No se aplicaron migraciones ni se crearon registros comerciales de prueba en producción.

Imagen publicada y probada: `sha256:c17101781244ea346aa939af9e8b9e052f655dffb155c32b80803c75a1487870`.

Evidencias: [resumen](forms-verification.json), [producción](forms-production-verification.json), [campos obligatorios](admin-required-fields.png), [selector con imágenes](admin-select-options.png), [SQL/HTTP](performance.json), [prueba de creación](../tests/e2e/admin-create.spec.ts) y [pruebas de validación](../tests/field-errors.test.ts).

Detalles: [JF-32](historial/JF-32-creacion-y-validacion-de-campos-obligatorios.md) y [JF-33](historial/JF-33-selectores-con-busqueda-y-vistas-previas.md).

Los siguientes informes se conservan como antecedentes.

# Diseño editorial y arrastre de fotos — 6 de noviembre de 2026

La tienda adopta una identidad marfil, nogal y bronce con tipografías Cormorant Garamond y Manrope servidas localmente. Se rediseñaron la portada, las colecciones, los productos, las secciones editoriales, el cierre y el pie de página; la identidad también se aplica a las páginas interiores y los formularios.

La biblioteca admite arrastrar grupos de fotografías, acumular selecciones y quitar archivos antes de enviarlos. El servidor conserva WebP adecuados después de validarlos y decodificarlos, evitando comprimir dos veces los originales ya preparados.

- TypeScript y 10 pruebas unitarias aprobadas.
- 16 pruebas de navegador aprobadas, incluyendo arrastre de dos fotos, incorporación de una tercera por selector, concurrencia, fallo parcial, reintento y comprobación de bytes sin recompresión.
- 35 vistas comprobadas: siete rutas a 360, 390, 768, 1024 y 1440 px; respuesta correcta, un título principal y ningún desbordamiento.
- Cero errores JavaScript y cero solicitudes a dominios externos en el verificador visual. Las fuentes no se descargan de Google durante la navegación.
- Misma fotografía preparada de 161.252 bytes y tres repeticiones locales: mediana de subida de 227,4 ms antes y 93,3 ms después. El procesamiento pasó de 209,2 ms a 70,7 ms de mediana. Se excluye la preparación del navegador y la velocidad de internet; estas cifras no garantizan tiempos para cualquier conexión.
- El original sin preparar sigue la conversión normal. Un falso WebP se rechaza con 400. Los WebP conservados siguen teniendo miniatura de 360 px y las mismas protecciones al eliminarlos.

Evidencias: [revisión visual](design-verification.json), [medición de subidas](design-upload-verification.json), [portada en escritorio](design-home-1440.png), [portada móvil](design-home-390.png), [catálogo](design-catalog-1440.png), [ficha](design-product-1440.png) y [selección de grupos](admin-upload-groups.png).

Publicado con copia de seguridad previa y servicio saludable. En el dominio real se comprobaron la composición de escritorio y móvil, las fuentes locales, el favicon y el arrastre acumulativo de tres fotos; se vació la selección sin enviar imágenes de prueba. [Informe de producción](editorial-production-verification.json).

La medición posterior completó 105 respuestas HTML públicas, incluida una búsqueda inédita, con **0 consultas SQL públicas adicionales**. [Resultado SQL/HTTP](performance.json).

Imagen publicada: `sha256:538fe36499885e45a05f82e7de8a90fc06700bd7327cb60d45f989497e2f5dbb`. El único ajuste entre la imagen de las pruebas de navegador y la final fue el color del favicon; se validó su SVG y se comprobó el recurso publicado.

Decisiones y fuentes: [JF-30](historial/JF-30-diseno-editorial-e-identidad-visual.md) y [JF-31](historial/JF-31-arrastre-de-grupos-y-subida-sin-recompresion.md).

Los resultados siguientes corresponden a las entregas anteriores.

# Verificación de consultas y subidas — 6 de noviembre de 2026

Publicado en https://jhamor.purprum.com con selección múltiple de hasta 20 fotos, compresión mediante trabajador, dos transferencias simultáneas, progreso y reintento por archivo. Las listas administrativas se reutilizan hasta que cambian y se han retirado las precargas de pantallas privadas.

- TypeScript y 10 pruebas unitarias aprobadas.
- 16 pruebas de navegador aprobadas en una base de prueba reiniciada: compra, concurrencia de inventario, permisos, publicación, miniaturas, eliminación, subida múltiple, compresión real y errores parciales.
- En producción, el resumen pasó de 8 consultas por petición a 2 en la primera y 1 al repetir. Productos pasó de 4 a 3/1; las otras cinco secciones medidas de 3 a 2/1. La consulta restante comprueba la sesión y los permisos actuales.
- El SQL inicial ya consumía menos de 1 ms por respuesta en la muestra. Los tiempos HTTP no son una medición aislada de la base de datos; no se promete una mejora uniforme de latencia para todas las redes.
- En QA local, una fotografía JPEG de 1.201.937 bytes se preparó en 161.252 bytes: aproximadamente 86,6 % menos de transferencia. Mediana de subida anterior del original: 294,8 ms; mediana actual con entrada preparada: 227,4 ms. Esta comparación excluye preparación del navegador y no reproduce ancho de banda doméstico.
- Comprobación del dominio real: menú compacto, persistencia, móvil, selector sin petición API al cambiar portada, actualización de opciones con una petición y sin errores JavaScript.
- 105 respuestas HTML públicas comprobadas después del despliegue, incluida una búsqueda nueva: 0 consultas SQL públicas adicionales.
- Copia de seguridad previa completada, servicio saludable y configuración Nginx validada y recargada. No se aplicaron migraciones ni se modificaron productos, pedidos o imágenes reales para medir.

Imagen publicada: `sha256:af9195838c5d9ffeb0dcca1c9ac58b8a4b76be4a31b6439cf96edb96e21387b0`.

Evidencias: [mediciones antes/después](admin-performance-verification.json), [navegador en producción](admin-production-verification.json), [SQL público](performance.json), [pruebas nuevas](../tests/e2e/admin-performance.spec.ts), [pruebas de caché](../tests/admin-cache.test.ts), [JF-28](historial/JF-28-consultas-y-cache-de-administracion.md) y [JF-29](historial/JF-29-subida-multiple-y-optimizacion-de-imagenes.md).

Los resultados siguientes se conservan como antecedentes de entregas anteriores.

# Verificación del panel — 5 de noviembre de 2026

Se publicó el menú contraíble con navegación por iconos, se retiró la cabecera decorativa, se incorporó eliminación de imágenes sin referencias y se añadieron miniaturas para biblioteca y portada.

- 7 pruebas de validación y 14 pruebas de navegador aprobadas sobre datos de prueba.
- Probada la navegación compacta, persistencia al recargar y adaptación móvil.
- Seleccionar portada: 0 peticiones a la API. Actualizar biblioteca: 1 petición específica y 0 recargas RSC del editor, conservando texto sin guardar.
- Probada eliminación de archivos sin uso, protección de portada/galerías/pedidos históricos y asignación/eliminación simultáneas.
- Adaptación comprobada con 51 imágenes antiguas de prueba: 51 miniaturas generadas. En producción se generó la miniatura pendiente de 1 imagen, sin fallos.
- Comprobación del dominio real: cabecera retirada, iconos operativos, preferencia recordada, móvil correcto y sin errores JavaScript.
- La medición posterior conserva 0 consultas públicas adicionales en 105 respuestas HTML.
- TypeScript, imagen Docker y servicios saludables.

Imagen de esta entrega: `sha256:5e4b0d352a97c2d89aa458ce3b6595cbcd973973ccb9398390a0e5cfe288ac91`.

Evidencias: [resumen](admin-media-verification.json), [navegador de producción](admin-production-verification.json), [SQL/HTTP](performance.json) y [pruebas de administración](../tests/e2e/admin-media.spec.ts).

Detalles y motivos en [JF-25](historial/JF-25-menu-lateral-contraible-y-panel-sin-franja.md), [JF-26](historial/JF-26-eliminacion-segura-de-imagenes.md) y [JF-27](historial/JF-27-miniaturas-y-selector-de-portada.md).

## Antecedente conservado

El informe siguiente corresponde a la entrega previa; sus cifras, capturas e imagen identifican aquella comprobación y no una nueva ejecución de todos sus verificadores.

## Verificación — actualización del 5 de noviembre de 2026

Web: https://jhamor.purprum.com. Panel: https://jhamor.purprum.com/admin. Repositorio: https://github.com/victovictorio00/jham-or.

### Resultado publicado

- Franja verde superior eliminada de la tienda y retirada su edición del panel.
- Inicio, catálogo, fichas, páginas informativas, contacto, nosotros y sitemap generados como HTML estático. La compilación indica `○` o `●` para esas rutas. Cuenta, acceso, pedidos y administración mantienen autorización dinámica.
- Lectores públicos sin acceso a Prisma: usan la copia publicada. No hay TTL de cinco minutos ni polling de tablas públicas.
- 15 páginas públicas y 15 variantes principales de imágenes precargadas al arrancar antes de marcar la aplicación saludable.
- 7 pruebas de validación, 7 E2E comerciales y 2 E2E específicas de publicación aprobadas.
- Las pruebas cubren compra, autenticación y permisos, inventario concurrente, idempotencia, cancelación única, cupones, fabricación a pedido, imágenes, exportación, guardados sin cambios, HTML generado tras editar, publicación y retirada de páginas y consultas ante búsquedas nuevas.
- Reinicio con una publicación interrumpida comprobado: el cambio confirmado en PostgreSQL se recupera y las visitas posteriores realizan 0 consultas públicas. Ver [publication-recovery.json](publication-recovery.json).
- Revisión del dominio real: 46 combinaciones de página y tamaño sin errores JavaScript, sin desbordamiento y sin franja de anuncios. Cookies privadas comprobadas HttpOnly, Secure y SameSite=Lax.
- TypeScript, compilación Docker, validación Compose y configuración Nginx correctos. Servicios saludables. Auriel sigue respondiendo HTTP 200.

### Consultas y rendimiento

[Informe de producción](performance.json): 105 peticiones HTML, incluyendo la primera visita de cada URL medida, una búsqueda nunca utilizada y un filtro por categoría. La precarga la hizo la aplicación al arrancar; el verificador no calentó previamente esas URLs.

Todas las respuestas dieron `x-nextjs-cache: HIT`. Incremento de consultas sobre Product, Category, Setting, Page y PublicationState: **0**. Las comprobaciones privadas de sesión, las operaciones administrativas y los healthchecks `SELECT 1` quedan fuera de este contador.

| Ruta | Peticiones | Consultas públicas adicionales | Mediana HTTPS completa |
| --- | ---: | ---: | ---: |
| Inicio | 15 | 0 | 29,6 ms |
| Catálogo | 15 | 0 | 36,8 ms |
| Ficha del sofá | 15 | 0 | 29,2 ms |
| Nosotros | 15 | 0 | 29,3 ms |
| Términos | 15 | 0 | 27,6 ms |
| Búsqueda nueva | 15 | 0 | 29,4 ms |
| Filtro de sala y precio | 15 | 0 | 31,8 ms |

En HTTP local, las respuestas estáticas medidas tuvieron medianas de alrededor de 6 ms; ver [performance-static-qa.json](performance-static-qa.json). Las mediciones HTTPS incluyen variación de red y Cloudflare; el informe conserva también los percentiles altos.

Muestra móvil: [production-browser.json](production-browser.json), 390 px, caché de navegador vacía, latencia 150 ms, descarga de 1,6 Mbps y CPU 4×. LCP observado: 1.292 ms; CLS: 0. Es una muestra sintética, no datos de usuarios reales ni una garantía para todas las redes.

### Despliegue y ubicación

Imagen publicada: `sha256:e48850807645d692c413dd97bb530208fa904cd6a4c9bb151856a3c295fdffdb`.

Código, scripts, documentación, registros y copias locales reunidos en `/home/sistemas/jham-or`. Se preservó el historial de implementación al integrarlo con el commit inicial del nuevo repositorio. Los registros están en `var/logs` y las copias en `var/backups`, excluidos de Git junto con claves y credenciales.

El despliegue continúa usando el proyecto Compose `jhamor`, PostgreSQL independiente con alias `jhamor-db`, archivos subidos en `jhamor_uploads`, publicación en `jhamor_publication` y caché de imágenes en `jhamor_image_cache`. Los volúmenes no se reemplazaron al mover el repositorio. La aplicación corre como usuario sin privilegios y la imagen no contiene archivos de credenciales.

Nginx usa la configuración fuente del repositorio `infra/nginx.conf`, instalada en el proxy compartido del servidor. El certificado del dominio conserva su renovación mediante el temporizador existente. El script de despliegue instala la configuración y espera la precarga antes de recargar el proxy.

Las tareas programadas se actualizaron a la nueva ruta: copia diaria a las 04:00 y limpieza de sesiones caducadas a las 04:10, hora del servidor. Las copias incluyen PostgreSQL, imágenes subidas y publicación persistida. La restauración de PostgreSQL ya se verificó en una base temporal; los datos de las pruebas se mantuvieron en `jhamor_test`.

### Funcionamiento

[Detalles de publicación, recuperación y consultas](PUBLICATION.md). Guardar un recurso público regenera su copia e invalida su HTML. Los cambios privados no invalidan el catálogo; los pedidos solo lo invalidan si alteran existencias.

El catálogo y las políticas iniciales siguen siendo de muestra. Los pagos continúan coordinándose manualmente por transferencia, Yape o efectivo; no se añadió una pasarela ni emisión fiscal.
