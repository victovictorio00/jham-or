# JF-29 — Subida múltiple y optimización de imágenes

- **Identificador:** JF-29
- **Fecha de documentación:** 2026-11-06

Fecha: **6 de noviembre de 2026**. Registro escrito durante la implementación. Antecedentes: [JF-12](JF-12-imagenes-y-biblioteca-multimedia.md), [JF-26](JF-26-eliminacion-segura-de-imagenes.md), [JF-27](JF-27-miniaturas-y-selector-de-portada.md) y [JF-28](JF-28-consultas-y-cache-de-administracion.md).

## Solicitud y situación anterior

El usuario pidió acelerar la subida y seleccionar varias fotografías juntas. El formulario admitía un archivo, lo enviaba completo y recargaba el panel después de cada fotografía. El servidor convertía la imagen a WebP y después volvía a decodificar ese WebP para generar la miniatura.

## Uso y resultado

En Administración → Imágenes se pueden seleccionar hasta 20 fotos por lote. Cada original puede ocupar hasta 5 MB; se admiten JPG, PNG, WebP y AVIF. La lista muestra nombre, preparación, porcentaje de transferencia, resultado y error de cada archivo. Si alguno falla, los demás continúan y el botón permite reintentar únicamente los pendientes o fallidos.

Se ejecutan como máximo dos subidas concurrentes desde cada formulario. Al finalizar un lote con algún éxito se refresca la biblioteca una sola vez, para conservar la búsqueda y paginación correctas. No se recarga el panel por cada foto ni se consulta para dibujar el progreso. La biblioteca y el selector invalidan sus datos administrativos al guardar cada imagen, por lo que una lectura posterior obtiene las imágenes nuevas.

## Preparación en el navegador

[media-upload.tsx](../../src/components/media-upload.tsx) coordina archivos, estado y reintentos. [image-optimizer.js](../../public/workers/image-optimizer.js) utiliza Web Worker, createImageBitmap y OffscreenCanvas: prepara las imágenes fuera del hilo principal, con un máximo de 1600 píxeles por lado y WebP de calidad 0,82. Las decodificaciones dentro del trabajador son secuenciales para contener memoria. Solo sustituye el original cuando el resultado pesa menos; conserva el nombre proporcionado por el usuario.

Se usa un trabajador servido desde el propio dominio y las API del navegador, sin añadir dependencias al paquete. Si el navegador no dispone de estas funciones, se envía el original y el servidor mantiene la optimización. Se rechazan imágenes de más de 25 megapíxeles. XMLHttpRequest proporciona progreso real de los bytes enviados; ese porcentaje no mide la conversión posterior del servidor. La preparación tiene una salida de respaldo a los 30 segundos y la transferencia un plazo de 120 segundos.

Los archivos se envían por separado al mismo endpoint autenticado existente. Esto permite un error y un reintento por imagen y evita un único formulario de hasta 100 MB que falle entero. Una selección con más de 20 fotos se rechaza antes del envío.

## Procesamiento del servidor

[upload.ts](../../src/lib/upload.ts) centraliza la ingestión. El servidor sigue validando tamaño, decodificación y límite de píxeles; la preparación del navegador no se considera una validación de confianza. Sharp corrige orientación, reduce a 1600 y decodifica una vez a píxeles. Desde ese resultado genera el WebP principal y la miniatura de 360 píxeles, sin volver a decodificar el WebP principal.

Un semáforo compartido en el proceso limita a dos las conversiones simultáneas y a veinte las solicitudes en espera; un exceso devuelve 429. Así se limita el consumo de memoria aunque varios administradores suban a la vez. Las escrituras de ambos archivos se esperan juntas; si falla la escritura o el registro SQL se intenta retirar ambos archivos para evitar residuos.

La respuesta devuelve el registro completo y `Server-Timing` con recepción, espera de turno, procesamiento, escritura y base de datos. No publica nombres privados ni contenido de las fotografías en estas métricas. No cambia el esquema de Media ni requiere una migración. Se conservan UUID, miniaturas y las comprobaciones de eliminación segura introducidas en JF-26.

## Validación y mediciones

[admin-performance.spec.ts](../../tests/e2e/admin-performance.spec.ts) selecciona tres archivos de una vez, comprueba transferencia reducida, concurrencia máxima de dos, fallo parcial simulado, reintento sin repetir éxitos, resolución almacenada y aparición de todas las fotos. También comprueba invalidación y revocación de sesión. La suite anterior mantiene las pruebas de miniaturas, referencias y eliminación simultánea.

[benchmark-upload.mjs](../../scripts/benchmark-upload.mjs) solo permite crear imágenes de prueba en localhost. Usa una fotografía pública de muestra ampliada a JPEG de 3000 × 2000, tres repeticiones por entrada, y elimina las imágenes al terminar. Compara el original de 1.201.937 bytes con una preparación de 161.252 bytes; esto representa aproximadamente un 86,6 % menos de transferencia en esa muestra. El tiempo de ida y vuelta local no representa la velocidad de una conexión residencial ni incluye el tiempo de preparación del navegador. La prueba de navegador comprueba además los bytes enviados por el trabajador real.

Resultados finales, imagen desplegada y limitaciones de las mediciones: [verificación](../VERIFICATION.md). Las capturas y los datos comerciales reales no se utilizan como fixtures ni se publican en el repositorio.

## Resultado observado

Pasaron las 16 pruebas de navegador, incluida la selección de tres fotos, el fallo simulado de una, la continuación de las otras dos y el reintento exclusivo de la fallida. La prueba exige como máximo dos transferencias concurrentes y una actualización administrativa por lote.

La mediana local para el original antes del cambio fue 294,8 ms; con el servidor nuevo fue 251,6 ms. La entrada previamente preparada tardó 227,4 ms de mediana en el servidor nuevo, frente a 251,4 ms en el anterior. Son tres repeticiones por caso, con variación de CPU y disco; no incluyen el tiempo de preparación del navegador. Por tanto se conserva el detalle en [mediciones](../admin-performance-verification.json) y no se promete ese mismo tiempo en cualquier red.

La imagen verificada en QA se publicó en el dominio real después de una copia de seguridad. Se comprobó su salud y la navegación administrativa con el verificador de producción. No se subieron fotografías de prueba al negocio real.
