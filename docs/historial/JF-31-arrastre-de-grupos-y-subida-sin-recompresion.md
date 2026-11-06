# JF-31 — Arrastre de grupos y subida sin recompresión innecesaria

- **Identificador:** JF-31
- **Fecha de documentación:** 2026-11-06
- **Tipo:** corrección de experiencia y rendimiento de imágenes.

## Problema comunicado

Después de [JF-29](JF-29-subida-multiple-y-optimizacion-de-imagenes.md), el usuario indicó que la subida seguía pareciendo individual y lenta, y que no podía soltar grupos de fotografías. El selector anterior aceptaba varias a la vez, pero no disponía de un destino de arrastre explícito y una nueva selección sustituía el lote anterior.

Además, aunque el navegador ya había reducido una foto a WebP, el servidor la decodificaba y volvía a comprimir el original a WebP de calidad 82. La medición anterior registraba alrededor de 200 ms de procesamiento para una entrada ya preparada; esa conversión adicional no era necesaria en todos los casos.

## Selección y arrastre

[media-upload.tsx](../../src/components/media-upload.tsx) presenta una zona visible con el texto “Arrastra tus fotos aquí”. Admite soltar varias fotos, indica cuándo se está arrastrando encima y conserva la alternativa de seleccionar mediante el explorador del dispositivo.

Los grupos nuevos se añaden a la selección existente. Las coincidencias por nombre, tamaño y fecha de modificación se omiten para evitar repetir el mismo archivo accidentalmente. Se indica cuántas fotos hay en el lote; se puede quitar cualquiera antes de subir o vaciar la selección completa. Vaciar la selección no elimina imágenes que ya se guardaron en la biblioteca.

Se mantiene el máximo de veinte fotos pendientes y cinco megabytes por original. Si un grupo excede el máximo, se conserva la selección anterior y se explica el límite. Los archivos no admitidos muestran su error por fotografía sin impedir el resto del lote. Durante una subida se bloquean cambios en la selección para mantener un progreso consistente.

La carga se inicia con una sola acción para todo el lote, con hasta dos transferencias simultáneas y una preparación secuencial en el trabajador. El progreso distingue la transferencia del momento en que el servidor está guardando. Los éxitos se conservan cuando se reintentan fallos. No se crea un único cuerpo multipart de hasta cien megabytes.

Los estilos de arrastre, foco, selección y cola están en [globals.css](../../src/app/globals.css). El input continúa teniendo `multiple`, etiqueta accesible y acceso mediante teclado, aunque se presenta dentro de un control visual mayor.

## Vía rápida del servidor

[upload.ts](../../src/lib/upload.ts) inspecciona el formato real y siempre decodifica la imagen para verificarla. Conserva el límite de 25 megapíxeles y el semáforo de procesamiento del servidor. No confía en la extensión, el MIME ni en una afirmación enviada por el navegador.

Si se trata de un WebP estático de hasta 1600 píxeles por lado, sin orientación pendiente ni metadatos EXIF, XMP o IPTC, reutiliza sus bytes como archivo principal. Genera la miniatura desde los píxeles decodificados y evita comprimir otra vez el archivo principal. Una entrada que no cumple esas condiciones sigue la conversión normal, con rotación, reducción y WebP.

Esto mantiene la calidad del archivo ya preparado y evita trabajo de CPU. El nombre físico sigue siendo un UUID generado en el servidor y se conservan las validaciones y garantías de eliminación. Si falla una escritura o el registro de base de datos, se intenta retirar los archivos creados.

`X-Image-Processing` permite distinguir `validated-webp` y `converted-webp` en las comprobaciones; `Server-Timing` mantiene los tiempos de recepción, turno, proceso, disco y base de datos. Estos encabezados no incluyen nombres, correos ni datos de sesión.

## Pruebas

[admin-performance.spec.ts](../../tests/e2e/admin-performance.spec.ts) simula el arrastre de dos fotos en una operación, añade otra por el selector, comprueba las tres en la cola y realiza una sola subida del lote. Simula un fallo, comprueba concurrencia máxima de dos, transferencia reducida y reintento exclusivo del archivo fallido. Se conserva la comprobación de invalidación de caché y sesión revocada.

La prueba de servidor comprueba que un WebP preparado se devuelve byte por byte sin recompresión, que tiene miniatura de 360 píxeles y que una falsa imagen WebP devuelve 400. El PNG sigue usando la vía de conversión. Las pruebas anteriores conservan la protección de imágenes vinculadas a productos, galerías, portada y pedidos históricos.

El antes/después medido con la misma fotografía de muestra y las limitaciones de la prueba se registran en [verificación](../VERIFICATION.md). No se crean imágenes de prueba en producción para obtener estas cifras.

## Medición obtenida

Con la misma fotografía preparada de 161.252 bytes, tres repeticiones por caso, la mediana de la petición completa pasó de 227,4 ms a 93,3 ms en localhost. La mediana del tramo `process` pasó de 209,2 ms a 70,7 ms. La entrada original conserva la vía de conversión: su nueva mediana local fue 237,8 ms y no recibe el atajo por tener simplemente una extensión WebP.

Son mediciones del servidor y transferencia local; no incluyen la preparación en el navegador ni simulan una conexión móvil. Se conserva el detalle antes/después en [design-upload-verification.json](../design-upload-verification.json), sin imágenes privadas ni credenciales. Las 16 pruebas funcionales terminaron correctamente y se añadió una captura del lote de tres fotos en [admin-upload-groups.png](../admin-upload-groups.png).

## Comprobación del despliegue

La imagen final quedó saludable después de una copia de seguridad. El [verificador de producción](../../scripts/verify-editorial-production.mjs) confirmó el diseño y la selección acumulativa de tres fotos sin llamar al endpoint de subida ni escribir imágenes de prueba. Se conservan los resultados en [editorial-production-verification.json](../editorial-production-verification.json).

La comprobación pública de esta entrega completó 105 respuestas HTML con cero consultas SQL públicas adicionales. El informe de [verificación](../VERIFICATION.md) identifica la imagen y la diferencia final del favicon respecto a la imagen probada en QA.
