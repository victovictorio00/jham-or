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
