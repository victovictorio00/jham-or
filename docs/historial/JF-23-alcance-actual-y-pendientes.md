# JF-23 — Alcance actual, limitaciones y datos pendientes

- **Identificador:** JF-23
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** estado contrastado con 0614d4d y las guías existentes.

## Funcionalidades disponibles

El proyecto permite explorar muebles, elegir acabados, mantener una bolsa local, registrarse, iniciar sesión, registrar pedidos con validación de stock y consultar su seguimiento. El equipo dispone de catálogo, categorías, pedidos, clientes, permisos, imágenes, páginas, cupones, ajustes y auditoría.

Las páginas públicas se generan estáticamente con datos publicados. Compras, permisos e información personal conservan comprobaciones dinámicas. El sitio está desplegado con dominio y HTTPS.

## Datos comerciales que faltan completar

| Área | Acción pendiente del negocio |
| --- | --- |
| Muebles | Reemplazar las seis fichas de muestra, precios, medidas, materiales, acabados y existencias. |
| Fotografías | Subir imágenes reales/autorizadas que correspondan a los productos. |
| Contacto | Completar correo, teléfono, WhatsApp, dirección y horario definitivos. |
| Entrega | Confirmar cobertura, tarifa, recojo y coordinación de plazos. |
| Políticas | Completar identidad del negocio, condiciones, garantías y demás contenido definitivo. |

No son errores de código ocultos: son datos que no fueron suministrados como catálogo real durante la creación.

## Integraciones no implementadas

- Cobro automático mediante pasarela o confirmación bancaria por webhook.
- Emisión fiscal o facturación electrónica.
- Correo configurado para recuperar contraseña o verificar direcciones.
- Cálculo de envío por distancia/distrito y conexión con transportistas.
- Sincronización de bolsa entre cuentas o dispositivos.
- Reglas de uso de cupón por persona o un contador comercial de canjes.
- Eliminación física general de imágenes con análisis completo de referencias.
- Un CMS universal que permita modificar desde el panel cada estructura, fuente, color o texto presente en el código.

Un estado manual de pago no sustituye esas integraciones.

## Límites técnicos que explican el diseño

El catálogo público envía sus tarjetas para filtrar en el navegador. Es adecuado al catálogo comprobado, pero antes de crecer a un volumen muy grande habría que medir tamaño de publicación, transferencia, memoria y tiempo de precarga. No se ha realizado un ensayo de cientos de miles de muebles.

La publicación y su cola en memoria se diseñaron para el despliegue actual de una aplicación. Un despliegue con múltiples instancias independientes exige revisar coordinación de escritura, invalidación y almacenamiento compartido; no basta con duplicar contenedores sin comprobar ese flujo.

Los límites y permisos se aplican en código y se probaron con los casos existentes. No se realizó una certificación de accesibilidad, una prueba formal de penetración ni una garantía de rendimiento en todas las redes.

## Operaciones que necesitan procedimiento

Modificar datos directamente por SQL no publica automáticamente la copia. Las importaciones deben usar las revisiones adecuadas y un procedimiento de publicación. Un borrado de volúmenes no es una manera de actualizar código.

Las copias y claves se mantienen fuera de Git. No se deben añadir al repositorio para interpretar literalmente “todo el proyecto”: el código y la documentación se versionan, los datos privados se conservan mediante operación y copias.

## Criterio para próximos cambios

Una petición futura debe registrarse con un nuevo JF, describir qué comportamiento cambia, qué archivos afecta, cómo se verificó y si introduce migración o integración externa. No se dará por existente una función solo porque se proponga en esta lista.

- [Guía de administración](../ADMIN.md).
- [Publicación](../PUBLICATION.md).
- [Continuidad del historial](JF-24-documentacion-y-registro-de-futuros-cambios.md).
