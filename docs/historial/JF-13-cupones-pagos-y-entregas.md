# JF-13 — Cupones, pagos coordinados y modalidades de entrega

- **Identificador:** JF-13
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773.

## Cupones

Los cupones tienen código único, porcentaje, compra mínima, actividad y vencimiento opcional. El código se normaliza a mayúsculas; el porcentaje admitido está entre 1 y 80.

El cliente puede aplicar un código en el checkout. `/api/quote` exige sesión, limita intentos y obtiene precios reales de los productos y el cupón desde PostgreSQL. Devuelve subtotal y descuento sin convertir esa cotización en una reserva.

Al confirmar la compra, el servidor valida otra vez el cupón dentro de la transacción. Se comprueba existencia, actividad, fecha y subtotal mínimo. El descuento no se calcula sobre el envío, y el resultado se conserva en el pedido.

## Motivo de volver a validar

Entre una cotización y una confirmación pueden cambiar el precio, la disponibilidad o el vencimiento. La cifra calculada por el navegador no se acepta como importe definitivo.

La consulta de cupón es una operación privada explícita del comprador. No se ejecuta automáticamente al explorar la portada o filtrar muebles.

## Métodos de pago

| Código | Presentación | Comportamiento actual |
| --- | --- | --- |
| `TRANSFER` | Transferencia bancaria | Preferencia para coordinación posterior. |
| `YAPE` | Yape | Preferencia para coordinación posterior. |
| `CASH` | Efectivo | Pago a coordinar con el negocio. |

Los estados de pago son `PENDING`, `PAID` y `REFUNDED`. El equipo los registra manualmente. Cambiar a pagado no ejecuta un cobro; cambiar a reembolsado no envía dinero de vuelta.

No se integró una pasarela, un webhook bancario, emisión fiscal ni conciliación automática. Esta distinción se muestra también en los formularios y resúmenes para no presentar un pedido como comprobante de pago.

## Entrega

`DELIVERY` exige dirección y distrito y usa la tarifa pública configurada. `PICKUP` se habilita mediante una dirección de recojo; si esa configuración falta, la API rechaza el recojo aunque se intente enviar manualmente.

La configuración inicial contempla Lima Metropolitana y una tarifa de muestra de 8000 céntimos. Son valores iniciales editables, no cobertura o tarifa confirmadas del negocio real.

No hay cálculo automático por distancia, tarifas por distrito ni conexión con un transportista. Los plazos del producto son estimados y se conservan al pedir para coordinar la entrega.

## Evidencia y archivos

Se probó un cupón del 10 % en un mueble de fabricación a pedido, incluyendo el total final y la conservación de stock cero. También se rechazó un acabado no válido.

- [Validación de cupones y compra](../../src/lib/validation.ts).
- [Cálculo definitivo](../../src/lib/orders.ts).
- [API de cotización](<../../src/app/api/[...path]/route.ts>).
- [Checkout](../../src/components/forms.tsx).
