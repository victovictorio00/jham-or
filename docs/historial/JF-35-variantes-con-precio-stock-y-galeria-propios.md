# JF-35 — Variantes con precio, stock y galería propios

- **Identificador:** JF-35
- **Fecha de documentación:** 2026-11-06
- **Tipo:** modelo comercial, administración, compra e inventario.

## Decisiones confirmadas

El usuario confirmó que cada variante tiene su propio precio, su propio stock y sus propias fotos. No se implementan como simples etiquetas de acabado ni como una galería que comparta inventario.

Un mueble puede seguir funcionando sin variantes. Los acabados de texto existentes se conservan para esos productos. La migración no convierte ni modifica comercialmente los muebles anteriores.

## Modelo y migración

[schema.prisma](../../prisma/schema.prisma) añade `Product.usesVariants` y la relación ProductVariant. Cada variante guarda UUID, producto, nombre, precio en céntimos, stock, imagen principal, galería, orden y estado activo. La [migración](../../prisma/migrations/20261106190000_product_variants/migration.sql) es aditiva, crea su índice por producto/estado/orden y restricciones de precio positivo y stock no negativo.

Se conserva el registro al retirar una variante, marcándolo como inactivo. Esto permite referirse a ella desde pedidos anteriores y reponer una cancelación sin inventar otra variante. El pedido conserva nombre, foto, acabado o variante, precio unitario y UUID elegidos en el momento de compra, de modo que una edición posterior no reescribe su historial.

La migración se aplica con copia de seguridad previa. La versión anterior de la aplicación puede seguir operando los productos existentes mientras se prepara el despliegue, porque todos empiezan sin variantes. Una vez existan productos con variantes activas, no se debe retroceder a una aplicación que las ignore: primero se necesita una versión compatible o un procedimiento de recuperación que considere pedidos e inventario.

## Administración

[variant-editor.tsx](../../src/components/variant-editor.tsx) permite hasta veinte variantes por producto. Cada una exige nombre, precio, stock y una foto, y admite una galería propia de hasta diez fotografías en total. Sus nombres e identificadores no se pueden repetir dentro de un producto. Las imágenes se seleccionan de la biblioteca y se pueden ordenar o retirar.

Al añadir variantes se ocultan los controles generales que dejarían de representar su precio, stock, acabado o fotografías. El producto conserva material, medidas, descripción, categoría y plazo común. El servidor deriva el precio mínimo y el inventario total de las variantes para los listados; no confía en importes o totales enviados por el navegador. Las variantes siempre controlan sus existencias.

La [API](../../src/app/api/[...path]/route.ts) valida todas las referencias de imagen y guarda producto y variantes dentro de la misma transacción. Un UUID perteneciente a otro producto no se puede reutilizar para moverlo o modificarlo. Las llamadas antiguas que editen metadatos de un producto con variantes no sobrescriben sus precios ni inventarios independientes.

## Catálogo, ficha y bolsa

Las tarjetas muestran las miniaturas de variantes al pasar el ratón o recibir foco; en móvil permanecen disponibles. Previsualizar cambia foto y precio de esa tarjeta. Su enlace abre la ficha con la variante elegida. Sin una previsualización concreta, el precio se presenta como “Desde”, utilizando el mínimo real de las variantes activas.

[product-details.tsx](../../src/components/product-details.tsx) permite cambiar de variante, recorrer sus propias fotografías y consultar su precio y unidades. El parámetro de variante se actualiza con el historial nativo del navegador, sin solicitar otra ficha al servidor. La cantidad y el estado Añadido se reinician al cambiar de variante.

La bolsa distingue producto y UUID de variante, por lo que dos colores no se mezclan. Conserva su imagen y precio seleccionados, permite modificar cantidades y mantiene la compatibilidad con bolsas anteriores sin UUID de variante. La cotización del cupón calcula la promoción con el precio vigente de esa variante. Su consulta selecciona únicamente los campos necesarios para resolver la oferta; no carga descripciones ni galerías para calcular el descuento.

## Reserva y cancelación

[offers.ts](../../src/lib/offers.ts) resuelve el precio, foto e identidad permitidos a partir de los datos del servidor. Un UUID ajeno, inexistente o retirado se rechaza. El precio y el nombre enviados por el cliente no sustituyen los de la variante.

[orders.ts](../../src/lib/orders.ts) agrupa cantidades por variante y verifica el máximo existente de veinte unidades por mueble. Descuenta mediante una actualización condicional que exige stock suficiente, dentro de la transacción serializable y sus reintentos. Se conserva la idempotencia: repetir el mismo pedido no reserva otra vez.

Los inventarios del producto se sincronizan con la suma de sus variantes activas mediante una consulta parametrizada al escribir, no al navegar. Cancelar repone exactamente la variante reservada y una sola vez; si fue retirada, se repone en su registro histórico y no se suma a la oferta pública activa.

## Imágenes, publicación y compatibilidad

[media.ts](../../src/lib/media.ts) protege imágenes de variantes activas y las que aparecen en pedidos históricos. Se mantiene el bloqueo de referencias compartido con los escritores para que una eliminación no deje una foto asignada sin archivo. Las fotos solo vinculadas a una variante retirada pueden retirarse si ninguna referencia vigente o pedido las necesita.

La publicación persistida incluye variantes activas. Buscar, abrir accesos o previsualizar no consulta PostgreSQL. La precarga incluye las imágenes principales de variantes, mientras que las galerías adicionales se solicitan al utilizarlas. La versión heredada del producto sigue siendo compatible cuando no tiene variantes.

## Pruebas y evidencias

[variants.test.ts](../../tests/variants.test.ts) comprueba derivación de importes y existencias, nombres/UUID duplicados, datos inválidos, fotos y compatibilidad sin variantes. [collection-experience.spec.ts](../../tests/e2e/collection-experience.spec.ts) crea variantes desde el panel, las elige desde el catálogo y la ficha, distingue líneas de bolsa y verifica precios de cupones, agotamiento concurrente, idempotencia, rechazo de UUID desconocido y reposición de una variante retirada.

Los resultados reales, la imagen y las capturas figuran en [verificación](../VERIFICATION.md). Antecedentes: [JF-09](JF-09-pedidos-inventario-e-idempotencia.md), [JF-26](JF-26-eliminacion-segura-de-imagenes.md) y [JF-34](JF-34-carrusel-y-accesos-rapidos-del-catalogo.md).
