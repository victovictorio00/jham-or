# JF-37 — Carrusel automático y arrastre con el mouse

- **Identificador:** JF-37
- **Fecha de documentación:** 2026-11-07
- **Tipo:** interacción de la portada.

## Solicitud

El usuario pidió quitar el control de pausa del carrusel, mantener el cambio automático por tiempo y permitir mover las imágenes con el mouse.

## Comportamiento anterior

El carrusel de JF-34 avanzaba cada seis segundos, incluía un botón de pausa/reanudación y se detenía al pasar el puntero por encima. Admitía gestos táctiles y flechas, pero arrastrar con el mouse no cambiaba la fotografía.

## Cambio realizado

[home-carousel.tsx](../../src/components/home-carousel.tsx) elimina el botón y los iconos de pausa/reanudación. El avance automático mantiene seis segundos por imagen y continúa con el puntero encima. Al cambiar de imagen manualmente se inicia un nuevo intervalo completo, evitando saltos automáticos inmediatamente después del gesto.

El área de fotografías admite arrastre horizontal mediante Pointer Events, compartidos por mouse, lápiz y pantalla táctil. El gesto necesita superar 45 píxeles y predominar sobre el desplazamiento vertical. Moverse hacia la izquierda avanza; hacia la derecha retrocede. Un clic o un movimiento pequeño no cambia la imagen.

Se captura el puntero durante el gesto para recibir el final aunque salga del área. La cancelación del gesto o la pérdida de captura limpian el estado. Los botones quedan fuera del inicio de arrastre y conservan su acción normal. Se desactiva el arrastre nativo del archivo y la selección accidental de texto.

[storefront.css](../../src/app/storefront.css) utiliza cursores de mano abierta y cerrada. Conserva `touch-action: pan-y` para permitir desplazarse verticalmente por la página desde la fotografía en móvil.

## Temporización y accesibilidad

No se solicita otra fotografía principal antes de cargar la inicial; se mantiene la preparación de la siguiente imagen. No se consulta la API ni la base de datos para mover el carrusel.

El temporizador se suspende durante el arrastre, al ocultar la pestaña, al recorrer los controles con foco visible de teclado y cuando el sistema solicita movimiento reducido. Hacer clic con el mouse en una flecha no detiene el avance posterior. Se conservan flechas, indicadores y manejo con teclado.

La configuración de fotografías y orden en Diseño y tienda no cambia. No se modifican datos, dependencias ni el esquema de PostgreSQL.

## Validación

[verify-carousel-production.mjs](../../scripts/verify-carousel-production.mjs) verifica el arrastre en ambos sentidos, el umbral del gesto, avance automático con hover y después de pulsar una flecha, ausencia del control de pausa, preferencia de movimiento reducido y gestos táctiles reales mediante Chromium. Comprueba también que un movimiento vertical no cambie la imagen y que no existan peticiones API ni errores JavaScript.

Los resultados ejecutados se guardan en [carousel-drag-verification.json](../carousel-drag-verification.json), junto con el informe de despliegue en [VERIFICATION.md](../VERIFICATION.md). Las comprobaciones son de lectura sobre la portada; no crean productos, cuentas ni pedidos.

Antecedente: [JF-34 — Carrusel y accesos rápidos](JF-34-carrusel-y-accesos-rapidos-del-catalogo.md). Este documento registra la evolución posterior; el control de pausa descrito en JF-34 corresponde a la versión anterior.
