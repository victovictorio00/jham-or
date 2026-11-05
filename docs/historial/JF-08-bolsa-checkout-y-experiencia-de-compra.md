# JF-08 — Bolsa persistente y proceso de compra

- **Identificador:** JF-08
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773.

## Bolsa sin cuenta

El proveedor `CartProvider` conserva la selección en `localStorage`, bajo la clave `jhamor-cart`. Añadir un producto o cambiar su cantidad no escribe una tabla de bolsas en PostgreSQL.

Cada línea identifica el producto y su acabado. Dos acabados de un mismo mueble se conservan como selecciones diferentes. Al repetir el mismo producto y acabado, se suma la cantidad hasta el límite del cliente.

El navegador restaura la bolsa al recargar, descarta entradas que no cumplen comprobaciones básicas y permite eliminar líneas. Este almacenamiento pertenece al navegador utilizado; no constituye una bolsa sincronizada entre dispositivos.

## Compra desde una ficha

La ficha ofrece acabados configurados, cantidad, plazo y disponibilidad. Tras añadir el mueble se muestra confirmación y un enlace a la bolsa.

En la bolsa se presenta un subtotal orientativo y se informa de que los precios y el stock se confirmarán al enviar el pedido. Las copias locales pueden quedar antiguas; nunca son la autoridad para calcular la compra definitiva.

## Checkout

El checkout exige sesión y recoge:

- Nombre y teléfono de quien recibe.
- Entrega a domicilio o recojo habilitado.
- Dirección y distrito cuando hay envío.
- Preferencia de pago.
- Indicaciones y cupón opcional.
- Aceptación de términos de compra.

El envío utiliza la tarifa configurada. El recojo solo aparece si existe dirección de recojo; la API verifica la misma condición.

## Confirmación

Se genera una clave UUID para identificar el intento de compra. El servidor valida los productos y calcula el importe definitivo. Si registra el pedido, la UI vacía la bolsa y abre el detalle de la cuenta.

Un error conserva la selección para poder corregirla o reintentar. Un reintento con la misma clave no debe crear un segundo pedido; las garantías del servidor se explican en [JF-09](JF-09-pedidos-inventario-e-idempotencia.md).

## Pago y seguimiento

La confirmación crea un pedido pendiente, no un cobro bancario. El cliente puede consultar su resumen y los cambios de estado desde Mi cuenta. La entrega y el pago se coordinan con el equipo.

## Validaciones y pruebas

El servidor admite como máximo 30 líneas y 20 unidades por producto tras sumar sus líneas, con cantidades enteras. Se verificaron persistencia de bolsa, redirección al acceso, registro, compra y posterior consulta del pedido.

- [Bolsa y compra en ficha](../../src/components/shop.tsx).
- [Checkout y formularios](../../src/components/forms.tsx).
- [Página protegida de checkout](<../../src/app/(store)/checkout/page.tsx>).
