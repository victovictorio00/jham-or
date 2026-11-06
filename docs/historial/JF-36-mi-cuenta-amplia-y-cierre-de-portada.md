# JF-36 — Mi cuenta amplia y retirada del cierre de portada

- **Identificador:** JF-36
- **Fecha de documentación:** 2026-11-06
- **Tipo:** experiencia personal y presentación pública.

## Solicitud

El usuario pidió una sección Mi cuenta más estética, con mayor presencia y sin el aspecto comprimido anterior. También pidió retirar el bloque de portada “HAGAMOS ESPACIO PARA LO QUE IMPORTA / Tu próximo capítulo en casa”.

## Mi cuenta

[mi-cuenta/page.tsx](../../src/app/(store)/mi-cuenta/page.tsx) presenta una cabecera amplia con saludo, iniciales y tratamiento de marca. Los accesos a pedidos, datos y colección quedan separados y visibles en tarjetas. Cerrar sesión y el acceso administrativo, cuando corresponde al rol, siguen disponibles.

Los pedidos y los datos se distribuyen en dos paneles amplios en escritorio. El formulario del perfil deja de utilizar la columna estrecha de resumen de compra. En tablet y móvil se apilan, con espacio suficiente y accesos que desplazan a la sección elegida.

Los pedidos muestran referencia, fecha, estado, importe y acceso al detalle. El estado vacío recibe una composición propia con ilustración de mobiliario, explicación y acceso a la colección. No se añaden cifras globales o estadísticas que requieran consultas adicionales o puedan confundirse con el total histórico.

Los datos y el cambio de contraseña continúan usando el formulario existente, sus campos obligatorios, validaciones y comprobación de contraseña actual. El correo se mantiene como información de la cuenta. No se publican datos personales en la parte estática del sitio.

## Privacidad, paginación y consultas

Se conserva la comprobación de sesión y la consulta de pedidos restringida al usuario actual. Cada página obtiene veintiún registros para mostrar veinte y detectar la siguiente, sin una segunda consulta de conteo. La página se normaliza a un entero acotado y el orden incorpora un desempate por identificador.

No se introducen consultas periódicas, un panel de datos globales ni estadísticas calculadas mediante lecturas extras. Los enlaces privados a pedidos no se precargan anticipadamente. Mi cuenta sigue siendo dinámica y no indexable; navegar al catálogo mantiene la publicación estática.

## Retirada del bloque de portada

[La portada](../../src/app/(store)/page.tsx) elimina la sección de invitación solicitada. Se conservan los bloques de colecciones, selección de piezas, esencia y principios de diseño, además del pie de página con información útil. La retirada no afecta a Contacto ni a los canales configurados por el administrador.

La nueva cabecera de carrusel y los accesos de categorías se explican en [JF-34](JF-34-carrusel-y-accesos-rapidos-del-catalogo.md); las variantes e inventario se explican en [JF-35](JF-35-variantes-con-precio-stock-y-galeria-propios.md).

## Archivos y validación

Los estilos se limitan al sitio público en [storefront.css](../../src/app/storefront.css). Se reutilizan React, Lucide y la tipografía local existente; no se añaden librerías o servicios externos para el diseño.

[collection-experience.spec.ts](../../tests/e2e/collection-experience.spec.ts) abre Mi cuenta con una cuenta sintética, verifica amplitud del formulario, ausencia de desbordamiento en móvil, estado sin pedidos y aparición del pedido propio. Las pruebas anteriores conservan el aislamiento de pedidos y la redirección al acceso cuando no existe sesión.

Las capturas se realizan sobre QA con datos ficticios, sin divulgar cuentas, correos ni pedidos reales. Los resultados y la comprobación de despliegue están en [verificación](../VERIFICATION.md).
