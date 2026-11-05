# JF-26 — Eliminación de imágenes con comprobación de uso

- **Identificador:** JF-26
- **Fecha de documentación:** 2026-11-05
- **Tipo:** funcionalidad administrativa y consistencia de referencias.
- **Solicitud:** permitir eliminar imágenes subidas desde la biblioteca.

## Situación anterior

La biblioteca permitía subir, editar metadatos y copiar una ruta. No ofrecía eliminación de una imagen, de modo que las subidas sin uso seguían apareciendo y ocupando almacenamiento.

## Comportamiento nuevo

Cada tarjeta incorpora Eliminar y una confirmación. Una petición autorizada puede retirar el registro, el original y su miniatura. Los permisos y el origen se comprueban en el servidor.

Si la imagen está referenciada, se devuelve un error de uso y se conserva. Se comprueban productos, galerías, categorías, configuración, texto de páginas, líneas históricas de pedidos y la copia pública vigente. Las referencias de registros archivados también cuentan: archivar no equivale a dejar de conservar su información.

La comprobación de tablas usa una consulta parametrizada con `EXISTS`, sin descargar pedidos o todo el catálogo de la base para buscar una URL. La copia publicada ya disponible en memoria se comprueba por separado.

## Guardados y eliminación simultáneos

Se incorporaron bloqueos consultivos transaccionales: las escrituras de referencias comparten un bloqueo; la eliminación necesita el exclusivo. El guardado valida que las URL subidas continúan presentes en Media.

Una prueba detectó que usar una transacción de lectura habitual en el guardado y una vista serializable en la eliminación permitía dos respuestas exitosas bajo un orden concreto de espera. Se unificaron las operaciones relacionadas con el helper Serializable y sus reintentos de conflictos. Así, guardar una portada y borrar su imagen simultáneamente no puede aceptar ambas operaciones dejando la portada rota.

Los pedidos verifican sus imágenes y participan en la protección de referencias. La imagen guardada en las líneas históricas de una compra se conserva aunque después cambie la foto del producto.

## Archivos y operación

- `src/lib/media.ts`: referencias, comprobaciones, eliminación y limpieza de archivos.
- `src/lib/transaction.ts`: transacción Serializable con reintentos ante P2034.
- `src/lib/orders.ts`: participación de las compras en la protección.
- `src/app/api/[...path]/route.ts`: DELETE protegido y guardados que validan referencias.
- `src/components/admin.tsx`: botón, confirmación y mensajes.

La eliminación de metadatos genera un evento de auditoría. Si se produce un error de sistema de archivos distinto de archivo inexistente, se registra y se devuelve que no se completó toda la retirada física; la eliminación del registro y la limpieza física no son una transacción única de PostgreSQL.

No se añaden lecturas de uso por cada visita pública ni por cada tarjeta al cargar la biblioteca. Se comprueba el uso cuando se solicita la eliminación.

## Validación

Se probó la retirada de un original y su miniatura sin uso, la protección de una portada, el rechazo de guardar una URL borrada desde un editor antiguo, permisos de eliminación, una galería y la imagen histórica de un pedido. También se probó asignación y eliminación simultáneas.

La batería comercial existente volvió a comprobar stock concurrente, idempotencia y cancelación para revisar la extracción del helper transaccional.

## Referencias

- [Biblioteca anterior](JF-12-imagenes-y-biblioteca-multimedia.md).
- [Pedidos e inventario](JF-09-pedidos-inventario-e-idempotencia.md).
- [Servicio de imágenes](../../src/lib/media.ts).
- [Pruebas](../../tests/e2e/admin-media.spec.ts).
