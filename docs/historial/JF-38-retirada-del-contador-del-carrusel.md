# JF-38 — Retirada del contador del carrusel

- **Identificador:** JF-38
- **Fecha de documentación:** 2026-11-07
- **Tipo:** ajuste visual de la portada.

## Solicitud

El usuario pidió quitar también el contador que acompañaba al carrusel.

## Comportamiento anterior

Después de JF-37, la portada ya no tenía botón de pausa y permitía arrastrar las imágenes con el mouse. La zona inferior conservaba los indicadores de selección y un texto numérico con el formato «01 / 03».

## Cambio realizado

[home-carousel.tsx](../../src/components/home-carousel.tsx) deja de renderizar el texto que mostraba la posición y el número total de imágenes. El contador se retira del HTML y no se oculta únicamente mediante estilos.

[storefront.css](../../src/app/storefront.css) elimina la regla exclusiva del texto numérico, que ya no tiene un elemento al que aplicarse.

Los puntos de selección y las flechas permanecen disponibles. El carrusel conserva el avance cada seis segundos y los gestos de mouse y pantalla táctil incorporados en la entrega anterior.

## Datos y tecnologías

Es un ajuste del componente React existente y de su CSS. No se añaden dependencias, servicios ni peticiones de red. No se cambia la configuración de las imágenes en Diseño y tienda.

No hay migración ni modificaciones de PostgreSQL. El cambio no requiere editar productos, fotografías, cuentas ni pedidos.

## Validación y publicación

La compilación de producción comprueba TypeScript y genera las páginas con el componente actualizado. La comprobación específica del dominio revisa la ausencia del contador, la presencia de flechas e indicadores y el cambio de fotografía al usar la flecha siguiente.

También se revisan los errores JavaScript del navegador y el estado saludable de la aplicación después de sustituir la imagen Docker. Al tratarse de retirar un texto, no se añade una prueba unitaria que replique el marcado ni se repite la regresión comercial de JF-35.

Los resultados ejecutados se describen en [VERIFICATION.md](../VERIFICATION.md). La comprobación es de lectura y no crea datos comerciales.

## Antecedentes

[JF-34](JF-34-carrusel-y-accesos-rapidos-del-catalogo.md) documenta la primera portada con carrusel. [JF-37](JF-37-carrusel-automatico-y-arrastre-con-el-mouse.md) registra la retirada de la pausa y el arrastre. Sus descripciones de los elementos visibles corresponden a esas versiones históricas.
