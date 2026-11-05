# JF-10 — Panel de administración y herramientas comerciales

- **Identificador:** JF-10
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; guardados y publicación refinados en 9cab4ef y 0614d4d.

## Organización del panel

El panel se abre en `/admin`, con navegación lateral en escritorio y menú desplegable en móvil. Las páginas comprueban la cuenta y sus permisos antes de consultar información privada.

| Sección | Funcionalidad implementada |
| --- | --- |
| Resumen | Pendientes, ingresos marcados como pagados, cantidad de muebles/clientes, pedidos recientes y avisos de stock bajo. |
| Muebles | Crear y editar fichas, stock, fabricación, precios, acabados, fotos, visibilidad y archivo. |
| Categorías | Nombres, slugs, descripción, imagen, orden y actividad. |
| Pedidos | Búsqueda, filtro de estado, detalle, seguimiento, pago manual, notas, impresión y CSV. |
| Clientes | Datos básicos, habilitación y cambio de contraseña mediante las operaciones autorizadas. |
| Equipo y permisos | Gestión reservada al propietario. |
| Imágenes | Subir, optimizar, titular, describir y copiar rutas. |
| Páginas y SEO | Crear, editar, publicar o mantener borrador. |
| Cupones | Código, porcentaje, compra mínima y vencimiento. |
| Diseño y tienda | Portada, textos, contacto, cobertura, tarifa y recojo. |
| Historial de cambios | Eventos administrativos registrados por la aplicación. |

## Consultas de los listados

Se presentan 30 registros por página. Las lecturas solicitan 31 para saber si existe una siguiente página, evitando contar toda la tabla en cada listado. El dashboard usa agregados y lecturas acotadas, no carga todos los pedidos en el navegador.

La biblioteca de selección de imágenes del editor solicita como máximo 200 registros recientes y añade las referencias de muestra. Esta selección acotada no equivale a una biblioteca sin límite de registros.

## Edición y acciones

El editor reutiliza una configuración de campos por recurso y valida de nuevo en la API. Los importes se muestran en soles y se conservan en céntimos. Se ofrece confirmación al abandonar cambios sin guardar mediante la navegación gestionada y al salir de la página.

Archivar un mueble lo oculta y conserva el registro para la trazabilidad. Categorías y cupones se desactivan; las páginas se retiran de publicación. Estas acciones no representan un borrado general de las compras previas.

## Ingresos y pagos

El indicador de ingresos suma pedidos con pago marcado `PAID` y excluye cancelados. Es un agregado de lo registrado por el equipo; no es conciliación bancaria ni una certificación contable.

## Historial técnico y auditoría comercial

`Audit` registra acciones de administración con actor, acción, recurso, identificador y resumen. El historial de estados del pedido conserva además sus eventos. Las contraseñas y tokens no se guardan en los resúmenes de auditoría.

Esta carpeta JF documenta la evolución del software. No reemplaza a `Audit` ni genera un Markdown por cada edición comercial del panel.

- [Páginas del panel](../../src/app/admin).
- [Componentes y editores](../../src/components/admin.tsx).
- [Guía operativa](../ADMIN.md).
- [Guardados sin cambios](JF-16-cache-inicial-y-guardados-sin-cambios.md).
