# JF-04 — Base de datos, importes y migraciones

- **Identificador:** JF-04
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; PublicationState incorporado en 0614d4d.

## Fuente de verdad

PostgreSQL conserva usuarios, sesiones, productos, pedidos, configuración y revisiones. La copia pública sirve para lectura y presentación; no reemplaza las comprobaciones de compra en la base de datos.

Prisma describe las tablas en `prisma/schema.prisma`. La aplicación usa una instancia reutilizable de Prisma Client y un límite de conexiones en la URL de producción.

## Tablas y motivos

| Modelo | Datos principales | Motivo |
| --- | --- | --- |
| `User` | Identidad, correo único, teléfono, hash, rol y habilitación | Cuenta y autorización. |
| `Session` | Hash del token, usuario y expiración | Sesiones revocables en el servidor. |
| `Category` | Nombre, slug, descripción, imagen, orden y actividad | Organización y visibilidad del catálogo. |
| `Product` | SKU/slug únicos, precios, fotos, acabados, medidas, stock y fabricación | Ficha comercial y control de disponibilidad. |
| `Order` | Número único, clave idempotente, usuario, entrega, importes, estado e historial JSON | Pedido persistente con copia de lo comprado. |
| `Coupon` | Código único, porcentaje, mínimo, actividad y vencimiento | Descuento validado al comprar. |
| `Page` | Slug único, título, texto, descripción SEO y publicación | Información y políticas editables. |
| `Setting` | Clave y valor JSON | Configuración pública agrupada bajo `store`. |
| `Media` | URL única, nombre, texto alternativo, tamaño y dimensiones | Biblioteca de imágenes. |
| `Audit` | Actor, acción, recurso, identificador, resumen y fecha | Trazabilidad administrativa. |
| `RateLimit` | Clave, contador y ventana de vencimiento | Limitación persistente de intentos. |
| `PublicationState` | Recurso y revisión | Detectar publicaciones pendientes sin inspeccionar periódicamente todo el catálogo. |

## Importes en céntimos

Los importes comerciales se guardan como enteros. Por ejemplo, S/ 199,90 se conserva como `19990`. El formulario convierte de soles a céntimos y el formateador convierte para presentar.

Esto mantiene coherentes las sumas y descuentos del pedido. El porcentaje del cupón se aplica al subtotal y se redondea hacia abajo al céntimo mediante `Math.floor`.

La API acepta precio positivo, una oferta opcional menor al precio normal y cantidades enteras. El servidor obtiene el precio real del producto; un precio enviado por el navegador no sustituye al registrado.

## Restricciones e índices

Hay unicidad en correo, SKU, slugs, número de pedido, código de cupón y clave idempotente. También hay índices para catálogo activo, productos destacados, pedidos por usuario/estado/fecha, auditoría por fecha y expiración de sesiones y límites.

Las relaciones unen sesiones y pedidos con usuarios y productos con categorías. Las líneas del pedido son una copia JSON histórica; no se presentan como una relación viva que cambie de nombre o precio al editar el catálogo.

## Migraciones registradas

1. `20261105000000_initial`: crea el esquema comercial inicial.
2. `20261105010000_publication_state`: añade las revisiones de publicación.

`npm run db:migrate` aplica migraciones pendientes. Las migraciones ya aplicadas se conservan; una modificación posterior de sus archivos puede alterar sus comprobaciones de integridad.

## Seed y entornos

`prisma/seed.ts` crea por upsert categorías, seis productos de muestra, páginas y configuración. El propietario inicial depende de variables privadas. El seed no se debe ejecutar automáticamente con cada despliegue.

La base `jhamor_test` se utiliza para pruebas con datos ficticios. Un reset de pruebas no forma parte del despliegue comercial.

- [Esquema](../../prisma/schema.prisma).
- [Migraciones](../../prisma/migrations).
- [Seed](../../prisma/seed.ts).
- [Reglas de pedidos](../../src/lib/orders.ts).
