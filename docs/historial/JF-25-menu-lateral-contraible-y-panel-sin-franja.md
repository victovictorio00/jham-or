# JF-25 — Menú lateral contraíble y panel sin franja decorativa

- **Identificador:** JF-25
- **Fecha de documentación:** 2026-11-05
- **Tipo:** mejora de navegación y presentación administrativa.
- **Solicitud:** contraer el menú, conservar acceso por iconos y retirar los textos de la parte superior.

## Situación anterior

El menú de escritorio ocupaba siempre su ancho completo. La variante móvil podía abrirse como panel, pero no existía una vista de escritorio compacta. La cabecera añadía una fila con “Tu negocio, en orden.” y “JHAM-OR · PEN / S/”.

## Cambios realizados

Se añadió un control de contraer/expandir en el lateral. En escritorio, el modo compacto ocupa 76 px y deja disponibles los iconos de cada sección, de la tienda y de cerrar sesión. Los enlaces conservan nombre accesible y título para identificar su acción aunque el texto esté oculto.

La preferencia se guarda en la cookie no sensible `jhamor_admin_sidebar`, limitada a `/admin`. El layout la lee para presentar directamente el estado elegido al recargar, sin una consulta de preferencia a PostgreSQL ni un cambio de ancho posterior a la carga inicial.

Se eliminaron los textos y la barra decorativa de escritorio. En móvil se conserva únicamente el control necesario para abrir el menú, con cierre mediante Escape, enlace o fondo exterior. La preferencia compacta de escritorio no oculta las etiquetas del menú móvil.

## Archivos afectados

- `src/components/admin.tsx`: estructura, controles, navegación y accesibilidad.
- `src/app/admin/layout.tsx`: lectura de la preferencia antes de renderizar.
- `src/components/forms.tsx`: cierre de sesión con icono opcional.
- `src/app/globals.css`: ancho compacto, margen del contenido y adaptación móvil.

## Motivo técnico

El cambio de ancho es estado local y CSS. No se vuelve a leer toda la página ni se consulta una tabla de preferencias al pulsar el botón. La cookie permite que el primer HTML privado ya tenga el modo correcto y evita un salto visual de ancho tras recargar.

Las páginas privadas mantienen su comprobación de sesión y permisos. El menú no concede autorizaciones por mostrar un icono.

## Validación

Se comprobó en navegador el cambio de ancho, navegación por iconos, conservación al recargar, expansión, funcionamiento móvil y ausencia de desbordamiento. También se verificó que los textos retirados y la antigua cabecera no estén presentes.

La captura `docs/admin-collapsed.png` muestra el modo compacto. La prueba está en `tests/e2e/admin-media.spec.ts` y se ejecutó sobre la aplicación de pruebas aislada.

## Referencias

- [Panel original](JF-10-panel-de-administracion.md).
- [Componentes administrativos](../../src/components/admin.tsx).
- [Pruebas del cambio](../../tests/e2e/admin-media.spec.ts).
