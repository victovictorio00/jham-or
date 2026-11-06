# JF-32 — Creación y validación de campos obligatorios

- **Identificador:** JF-32
- **Fecha de documentación:** 2026-11-06
- **Tipo:** corrección de creación y claridad de formularios.

## Solicitud y problemas comprobados

El usuario indicó que no podía crear y pidió identificar con un asterisco los campos que debía completar. Se revisó la creación de muebles, categorías, páginas, cupones, clientes y miembros del equipo.

Se encontró un bloqueo concreto en Clientes: la API disponía de creación de cuentas, pero la sección no ofrecía acción de alta y `?edit=new` terminaba en 404. Además, la comprobación de permisos trataba la ausencia de usuario anterior como si se estuviera modificando una cuenta del equipo, exigiendo propietario incluso al crear un cliente.

También había dificultades de validación: el enlace se exigía manualmente y rechazaba espacios, mayúsculas o tildes; la contraseña inicial se mostraba con un texto que podía parecer opcional; y los detalles de errores de esquema o conflictos únicos se perdían detrás de un aviso genérico.

## Cambios de creación

[La sección administrativa](../../src/app/admin/[section]/page.tsx) ofrece Añadir cliente y prepara el formulario inicial. La [API](../../src/app/api/[...path]/route.ts) permite que un administrador cree clientes. Crear o modificar cuentas con permisos administrativos sigue exigiendo propietario; no se amplían los permisos del equipo ni se permite desactivar el acceso propio.

En formularios nuevos de muebles, categorías y páginas se propone el enlace a partir del nombre o título. Se normalizan tildes y separadores a minúsculas y guiones. El operador puede personalizarlo; una vez personalizado, escribir el nombre no lo sobrescribe. Los enlaces de registros ya existentes no se regeneran al editar su nombre, para conservar las URL públicas.

Los importes del editor se normalizan a céntimos enteros al introducirlos. Precio y oferta tienen mínimo positivo; el editor limita también días, stock, orden y porcentaje según sus intervalos. La oferta sigue validándose en el servidor contra el precio normal.

## Campos obligatorios y mensajes

[fields.tsx](../../src/components/fields.tsx) comparte el asterisco y su leyenda. Se utilizan en el editor, acceso, registro, perfil, entrega, pago, aceptación de términos, título de imágenes y selección de acabado. La marca se corresponde con el requisito del formulario; no se marcan como obligatorias las opciones o datos que admiten un valor vacío.

Los controles conservan `required` o su equivalente ARIA y nombres accesibles explícitos. El asterisco se oculta a lectores de pantalla para no incorporarlo al nombre del campo. Las contraseñas iniciales aparecen como obligatorias al crear una cuenta y como opcionales al editar. Al cambiar la contraseña del perfil, la contraseña actual pasa a ser obligatoria.

[field-errors.ts](../../src/lib/field-errors.ts) traduce los errores de esquema a mensajes en español asociados a sus campos. [auth.ts](../../src/lib/auth.ts) mantiene la respuesta 400 y añade `fieldErrors`. Los conflictos únicos devuelven 409 con el campo implicado —por ejemplo enlace, SKU o correo— sin hacer una consulta previa para detectar duplicados. Se conserva la restricción de base de datos como autoridad.

[forms.tsx](../../src/components/forms.tsx) conserva estos detalles mediante `RequestError`. El [editor](../../src/components/admin.tsx) muestra el error junto al campo, marca su estado y dirige el foco al primero. Los valores introducidos permanecen disponibles para corregir y reintentar. Un fallo de respuesta que no sea JSON también recibe un mensaje comprensible.

## Datos y seguridad

No se modifican esquemas, precios ni datos comerciales para implantar la corrección. Las pruebas de creación se realizan en la base aislada de QA. La API sigue verificando sesión, rol, origen, validación, restricciones únicas y referencias de imágenes. Los permisos no se toman de la caché del listado.

## Validación

[admin-create.spec.ts](../../tests/e2e/admin-create.spec.ts) crea mediante la interfaz un mueble, dos categorías, una página, un cupón, un cliente y un administrador. Comprueba enlace sugerido, precio en céntimos, oferta inválida, conflicto de enlace, conservación de valores, campo obligatorio y presencia del registro al terminar. También comprueba que un administrador pueda crear clientes y que reciba 403 al intentar crear un propietario.

[field-errors.test.ts](../../tests/field-errors.test.ts) comprueba normalización de enlaces y traducción de errores reales de los esquemas. La suite completa conserva compra, stock concurrente, sesiones, imágenes y publicación. El resultado definitivo y el despliegue se describen en [verificación](../VERIFICATION.md).

Antecedentes: [JF-07](JF-07-cuentas-sesiones-y-permisos.md), [JF-10](JF-10-panel-de-administracion.md) y [JF-28](JF-28-consultas-y-cache-de-administracion.md). Los controles desplegables se documentan en [JF-33](JF-33-selectores-con-busqueda-y-vistas-previas.md).

## Resultado registrado

Pasaron TypeScript, las 13 pruebas unitarias y las 17 pruebas de navegador. La suite se ejecutó con una base de QA reiniciada y la misma imagen desplegada. La prueba nueva verifica los seis tipos de creación y las restricciones de permisos, además de los mensajes de error y los selectores.

Después de la copia de seguridad y el despliegue, el [verificador de formularios en producción](../../scripts/verify-fields-production.mjs) comprobó campos, ruta de cliente, selectores, teclado y móvil sin enviar creaciones ni imágenes de prueba. El informe está en [forms-production-verification.json](../forms-production-verification.json). Se completaron también 105 respuestas HTML públicas sin consultas SQL públicas adicionales.

El [resumen de esta entrega](../forms-verification.json) identifica la imagen, los casos y los resultados. Las capturas de [campos obligatorios](../admin-required-fields.png) y [opciones con miniaturas](../admin-select-options.png) se hicieron sobre datos sintéticos de QA.
