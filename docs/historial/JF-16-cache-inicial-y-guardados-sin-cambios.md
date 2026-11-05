# JF-16 — Caché inicial y corrección de guardados sin cambios

- **Identificador:** JF-16
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773 y 9cab4ef; sustitución del lector público en 0614d4d.

## Primera estrategia

La primera implementación separó lectores públicos y privados. `unstable_cache` reutilizaba datos públicos y `React.cache` deduplicaba lecturas durante el render. El catálogo y sus fichas tenían una renovación de 300 segundos; ajustes y páginas se invalidaban por cambios.

El layout de tienda declaraba `force-dynamic`. Por eso una visita podía reutilizar datos sin SQL adicional, pero todavía renderizaba HTML en el servidor. Al vencer el TTL del catálogo también podía renovar lecturas aunque no hubiese una edición real.

Esta solución inicial ya evitaba consultar todo indiscriminadamente, pero no cumplía la petición posterior de comportarse como una tienda estática.

## Corrección de guardados repetidos

Se añadieron dos niveles para productos, configuración y otros recursos generales del editor:

1. El formulario detecta que no se modificó su estado y muestra “No hay cambios nuevos”.
2. Si se llama directamente a la API con los mismos campos, el servidor valida y compara con lo existente antes de actualizar.

El objetivo es evitar una actualización, un timestamp nuevo, una auditoría engañosa y una invalidación que no corresponden a un cambio.

## Incidencia en la configuración JSON

Comparar `JSON.stringify` de dos objetos completos podía considerar diferente una configuración solo por el orden de sus claves. Se cambió la comprobación para comparar los valores de los campos y se añadió la salida sin POST en el editor de configuración.

Esta corrección quedó en `9cab4ef`. Las pruebas verifican que una solicitud sin cambios conserva `updatedAt` y no añade auditorías. La comprobación en navegador también verificó cero escrituras de API al pulsar Guardar sin modificar ajustes.

## Alcance preciso

La optimización no es una garantía universal para todas las operaciones posibles. Un cambio de contraseña es una acción real; una actualización de estado o una nota de pedido puede necesitar auditoría. La edición de metadatos de una imagen utiliza su propio endpoint y no debe describirse como cubierta automáticamente por la detección genérica de todos los editores.

Tampoco se han eliminado las consultas de sesión y permisos de una operación privada.

## Estado posterior

La publicación estática sustituyó el acceso público directo a PostgreSQL. Los guardados sin cambios continúan evitando revisiones y regeneraciones, salvo que haya que reintentar una publicación que había fallado.

- [API y comparación de cambios](<../../src/app/api/[...path]/route.ts>).
- [Editor](../../src/components/admin.tsx).
- [Pruebas comerciales](../../tests/e2e/commerce.spec.ts).
- [Siguiente cambio de arquitectura](JF-17-publicacion-estatica-y-consultas.md).
