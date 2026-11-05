# JF-05 — Diseño visual, adaptación y retirada de la franja superior

- **Identificador:** JF-05
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; retirada de la franja en 0614d4d.

## Objetivo visual

La referencia de Auriel se utilizó para entender la estructura comercial. Para muebles se eligió otra presentación: fondos marfil, verde oscuro, tonos de madera, fotografía grande, títulos serif y controles sobrios.

La portada presenta una imagen principal, categorías por ambiente, selección de productos, relato de marca y contacto. Las fichas dan espacio a fotos, materiales, medidas y acabados.

## Archivos responsables

- `src/app/globals.css`: variables, estilos públicos y administrativos, tamaños y adaptación.
- `src/app/(store)/page.tsx`: composición de la portada.
- `src/components/shop.tsx`: marca, navegación, tarjetas y selección de productos.
- `src/app/(store)/layout.tsx`: estructura y pie compartidos.
- `public/icon.svg`: icono tipográfico de la marca.

## Adaptación e interacción

Se añadieron puntos de adaptación para móvil, tablet y escritorio. En móvil la navegación se despliega con botón y puede cerrarse con Escape. Las cuadrículas reducen columnas, el checkout pasa a disposición vertical y las tablas del panel se desplazan dentro de su contenedor.

Hay estados de foco visibles, etiquetas en controles e iconos, enlace para saltar al contenido y reducción de transiciones con `prefers-reduced-motion`. Estas medidas forman parte de la implementación; no se documenta una certificación formal de accesibilidad que no se haya realizado.

## Cambio solicitado: quitar la franja verde

La versión inicial tenía una barra superior con un anuncio y el texto “Diseñado para durar”. El usuario pidió retirarla.

Se eliminó el bloque visible de `Header`, se simplificaron sus propiedades y se retiró el campo correspondiente del editor administrativo. Se ajustó el cálculo de altura móvil del hero para no reservar el espacio que ocupaba la barra.

El campo `announcement` todavía existe en valores anteriores y en la validación de ajustes por compatibilidad. Su presencia en esos datos no significa que la franja siga renderizándose.

## Verificación registrada

Las pruebas revisaron tamaños públicos de 390, 768 y 1440 px, y la verificación del dominio añadió 360 px. La comprobación de producción recorrió 46 combinaciones de ruta y tamaño, sin errores JavaScript ni desbordamiento horizontal, y verificó la ausencia del bloque `.announcement`.

Las capturas son evidencias de una fecha concreta; no una promesa de que contenido futuro de cualquier longitud tendrá el mismo resultado.

- [Estilos](../../src/app/globals.css).
- [Cabecera y componentes públicos](../../src/components/shop.tsx).
- [Informe de navegador](../production-browser.json).
- [Captura móvil de producción](../production-mobile.png).
