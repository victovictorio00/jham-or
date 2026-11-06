# JF-33 — Selectores con búsqueda y vistas previas

- **Identificador:** JF-33
- **Fecha de documentación:** 2026-11-06
- **Tipo:** presentación e interacción de listas desplegables.

## Solicitud y situación anterior

El usuario pidió mejorar las listas de selección porque se presentaban con el diseño básico del navegador. Un `select` nativo permite elegir datos, pero la presentación de su lista depende del sistema operativo y no ofrecía búsqueda ni fotografías para distinguir imágenes.

## Control compartido

[select.tsx](../../src/components/select.tsx) implementa un control de React compartido con botón, flecha, estado de apertura, lista de opciones, marca de la opción elegida y estados de foco. Las listas con más de ocho opciones incorporan búsqueda local que ignora diferencias de mayúsculas y tildes. Un resultado vacío tiene su propio mensaje.

Los selectores de imágenes muestran miniaturas. Utilizan las variantes pequeñas existentes o una versión de 64 px del optimizador para imágenes de muestra o anteriores sin miniatura. Las imágenes de las opciones se cargan de forma diferida. El selector continúa usando la biblioteca previamente obtenida; buscar o elegir una opción no solicita otra lista a PostgreSQL.

El estilo utiliza fondo marfil, borde cálido, acentos bronce, separaciones entre opciones y sombra discreta, en consonancia con [JF-30](JF-30-diseno-editorial-e-identidad-visual.md). La altura está limitada y la lista puede desplazarse. Los textos largos se ajustan al espacio disponible.

## Integración

El control se utiliza en categorías, imágenes y permisos del editor; estados y pagos del pedido; filtros administrativos; ordenación del catálogo; y modalidad y método de pago de la compra. Los valores, nombres de campo y rutas existentes se conservan.

Se mantiene un `select` real sincronizado para `FormData`, validación y formularios GET. Su representación visible se sustituye por el nuevo control. La selección envía el evento de cambio correspondiente; no requiere adaptar la API. La activación desde el texto de una etiqueta también abre el control visible.

[globals.css](../../src/app/globals.css) contiene los estilos compartidos del control y sus estados. La tienda mantiene sus variables de tipografía, mientras que el desplegable toma la fuente del contexto en el que se abre.

## Accesibilidad y adaptación

El botón expone `combobox`, nombre accesible, apertura, lista controlada y estado obligatorio. La lista expone `listbox` y cada fila `option`, selección y disponibilidad. Las flechas, Inicio, Fin y Enter permiten recorrer y elegir opciones. Escape cierra y devuelve el foco; Tab continúa la navegación. Al abrir un selector largo se puede escribir en la búsqueda.

La lista se presenta mediante un portal de React DOM, de forma que las tarjetas o secciones con recorte no la corten. Su posición se calcula respecto al control y el espacio disponible, incluyendo apertura hacia arriba y límites laterales en móvil. Los clics exteriores cierran el menú. Al desplazar la página se recalcula su posición y se cierra si el control sale de la pantalla. El cálculo considera también el viewport visual del móvil. La búsqueda recibe el foco sin desplazar la página, para evitar que el menú se cierre o se descoloque al abrirse. No se incorpora una librería adicional.

La validación de un selector obligatorio dirige el foco a su control visible. Las etiquetas y mensajes se relacionan con el campo; el control nativo interno no crea un segundo elemento anunciado por el lector de pantalla.

## Verificación

[admin-create.spec.ts](../../tests/e2e/admin-create.spec.ts) comprueba selección desde la etiqueta, búsqueda de una imagen, elección sin llamada a la API, navegación por teclado, cierre con Escape y límites del desplegable en una pantalla de 390 px. Las pruebas existentes de portada se adaptan para interactuar con el control visible y conservan sus comprobaciones de cero llamadas al cambiar y una al actualizar biblioteca.

[helpers/select.ts](../../tests/helpers/select.ts) permite que las pruebas elijan opciones mediante clics reales en la lista. El [verificador de producción](../../scripts/verify-admin-production.mjs) utiliza el mismo flujo de interacción.

Las evidencias y los resultados reales se recogen en [verificación](../VERIFICATION.md). Este cambio no añade consultas periódicas, prelecturas privadas ni escrituras al abrir una lista.

## Resultado registrado

Pasaron TypeScript, las 13 pruebas unitarias y las 17 pruebas de navegador. La suite se ejecutó con una base de QA reiniciada y la misma imagen desplegada. La prueba nueva verifica los seis tipos de creación y las restricciones de permisos, además de los mensajes de error y los selectores.

Después de la copia de seguridad y el despliegue, el [verificador de formularios en producción](../../scripts/verify-fields-production.mjs) comprobó campos, ruta de cliente, selectores, teclado y móvil sin enviar creaciones ni imágenes de prueba. El informe está en [forms-production-verification.json](../forms-production-verification.json). Se completaron también 105 respuestas HTML públicas sin consultas SQL públicas adicionales.

El [resumen de esta entrega](../forms-verification.json) identifica la imagen, los casos y los resultados. Las capturas de [campos obligatorios](../admin-required-fields.png) y [opciones con miniaturas](../admin-select-options.png) se hicieron sobre datos sintéticos de QA.
