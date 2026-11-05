# JF-09 — Pedidos, inventario concurrente e idempotencia

- **Identificador:** JF-09
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; revisión pública transaccional añadida en 0614d4d.

## Problemas que resuelve

Una misma última unidad puede ser solicitada por dos compradores. Un navegador también puede repetir una confirmación por doble clic o fallo de red. La aplicación debe mantener el inventario y evitar duplicar pedidos.

## Creación transaccional

`placeOrder` valida la entrada y ejecuta una transacción con aislamiento `Serializable` y tiempo máximo configurado de 15 segundos. Los conflictos Prisma `P2034` admiten hasta tres reintentos adicionales.

Dentro de la transacción se realiza lo siguiente:

1. Buscar la clave idempotente y, si existe, comprobar que pertenece al mismo usuario.
2. Cargar los productos activos y sus categorías disponibles.
3. Validar cada acabado y sumar cantidades por producto.
4. Descontar stock solo si el producto lo controla y conserva unidades suficientes.
5. Comprobar entrega, tarifa y cupón contra datos de PostgreSQL.
6. Calcular subtotal, envío, descuento y total en céntimos.
7. Crear el pedido con copias de las líneas y un primer evento de historial.
8. Marcar la revisión del catálogo si se modificó stock.

Las modificaciones de inventario se recorren con orden estable de identificadores. Si una comprobación falla, la transacción no confirma el descuento parcial.

## Fabricación a pedido

Los muebles con `madeToOrder` no descuentan stock. Su línea conserva ese modo y el plazo estimado al comprar. Un pedido de ese tipo no obliga a republicar el catálogo si no cambia existencias.

## Historial y datos conservados

El pedido guarda nombre, correo y teléfono del cliente, modalidad y dirección de entrega, preferencia de pago, importes y líneas JSON con nombre, SKU, imagen, acabado, cantidad, precio unitario, modo de fabricación y plazo.

Editar el producto posteriormente no recalcula un pedido histórico. El número comercial se presenta como `JO-` y una numeración formateada; la secuencia de base de datos puede tener huecos tras intentos revertidos.

## Estados

| Estado actual | Transiciones admitidas |
| --- | --- |
| Pendiente | Confirmado o Cancelado. |
| Confirmado | En fabricación, Listo o Cancelado. |
| En fabricación | Listo o Cancelado. |
| Listo | En camino, Entregado o Cancelado. |
| En camino | Entregado. |
| Entregado | Sin reapertura. |
| Cancelado | Sin reapertura. |

Al cancelar un pedido no cancelado, se repone una sola vez el stock de las líneas que lo reservaron. Repetir la misma cancelación no repone otra vez. La actualización de estado, historial y auditoría se confirma de forma transaccional.

## Evidencia

Las pruebas enviaron dos compras simultáneas sobre una última unidad: se aceptó una y se rechazó la otra. También comprobaron la repetición idempotente, la reposición única y el rechazo de reapertura.

La confirmación y el estado privado siguen leyendo PostgreSQL. Publicar estáticamente el catálogo no elimina estas garantías.

- [Servicio de pedidos](../../src/lib/orders.ts).
- [Estados y transiciones](../../src/lib/shared.ts).
- [Pruebas comerciales](../../tests/e2e/commerce.spec.ts).
