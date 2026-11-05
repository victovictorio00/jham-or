# JF-01 — Creación del proyecto y alcance original

- **Identificador:** JF-01
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; contexto inicial confirmado por la conversación de creación.

## Necesidad que dio origen al proyecto

Se solicitó una tienda llamada **Jham-or**, dedicada a muebles, tomando como referencia los flujos de Auriel Cookies. El objetivo era conservar una organización comercial familiar —catálogo, bolsa, cuenta, pedidos y administración— con una presentación más elegante y adecuada al mobiliario.

El usuario pidió React, PostgreSQL, acceso libre a los productos y una cuenta obligatoria para finalizar la compra. También pidió revisar el rendimiento y evitar consultas innecesarias. Posteriormente confirmó el dominio `jhamor.purprum.com`, el alojamiento mediante Nginx y los precios en soles.

## Decisiones de alcance

- Construir una aplicación independiente, con sus propias cuentas, sesiones, productos y pedidos.
- Usar Auriel como referencia funcional; no importar su base de clientes, sus pedidos ni su identidad visual.
- Permitir explorar y guardar una bolsa sin registro.
- Solicitar autenticación al entrar al checkout y comprobarla de nuevo en la API.
- Ofrecer gestión comercial desde el panel y mantener los datos sensibles en el servidor.
- Comenzar con productos y fotografías de muestra para hacer revisable la tienda completa.

## Qué se entregó inicialmente

La primera entrega agrupó portada, catálogo, fichas, bolsa, registro, acceso, checkout, cuenta del cliente, seguimiento de pedidos, administración, imágenes, cupones, páginas, infraestructura y pruebas. Por eso el commit inicial de implementación es amplio: no existe un commit separado por cada una de estas funcionalidades.

Se prepararon seis muebles de ejemplo y las categorías Sala, Comedor y Dormitorio. Se creó un propietario mediante variables privadas del servidor. Los datos comerciales definitivos deben cargarse desde el panel.

## Evolución posterior

La primera versión renderizaba la tienda en cada petición y utilizaba una caché de datos. Después se pidió quitar la franja verde y servir las páginas públicas como estáticas, actualizándolas al cambiar el contenido. Ese cambio se detalla en [JF-17](JF-17-publicacion-estatica-y-consultas.md).

El trabajo comenzó en `/home/sistemas/Jham-or`. Cuando el usuario proporcionó el repositorio nuevo, se integró todo en `/home/sistemas/jham-or`; ver [JF-19](JF-19-migracion-y-organizacion-del-repositorio.md).

## Evidencia y límites del registro

Este archivo reconstruye el alcance a partir de la solicitud original, el código y los commits conservados. No asigna horas inventadas a la implementación de cada componente.

- [Presentación y puesta en marcha](../../README.md).
- [Datos iniciales](../../prisma/seed.ts).
- [Guía del administrador](../ADMIN.md).
- [Cronología de commits](JF-21-cronologia-de-commits-y-correcciones.md).
