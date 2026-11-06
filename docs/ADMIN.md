# Administrar Jham-or

Entra en https://jhamor.purprum.com/admin. Si todavía no has iniciado sesión, la web te lleva al formulario de acceso. La cuenta de propietario inicial se guarda en `.env` del servidor: `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Cambia la contraseña en Mi cuenta y conserva tus credenciales en un gestor de contraseñas.

En escritorio, el botón junto a la marca contrae el menú a iconos y recuerda la elección. Cada icono conserva el nombre de su sección al pasar el cursor. En móvil se utiliza el botón de menú, con cierre mediante Escape o el fondo exterior. La antigua franja decorativa superior se retiró.

El panel reutiliza los datos consultados y los actualiza al guardar cambios. El botón Actualizar datos del menú fuerza una lectura de la sección actual, útil después de cambios realizados desde fuera de la aplicación. No hay consultas periódicas; los permisos se comprueban en cada petición.

## Apertura

El catálogo de seis muebles es una **muestra**, con fotografías de referencia obtenidas de Unsplash. Sustituye nombres, fotos, materiales, medidas, precios y existencias por tus productos reales. No se han copiado clientes, cuentas ni pedidos de Auriel.

Completa Diseño y tienda: contacto, WhatsApp con código de país, dirección, horario, cobertura y costo de envío. El recojo se habilita al indicar una dirección de recojo. Revisa las páginas Términos, Privacidad y Envíos; contienen un texto inicial que requiere los datos y condiciones definitivas del negocio.

## Catálogo e inventario

Muebles → Añadir mueble permite definir nombre, enlace, SKU, categoría, descripción, precio, oferta, imágenes, material, medidas, acabados y plazo. Los precios se escriben en soles; el servidor conserva céntimos enteros. Las ofertas deben ser menores al precio normal.

Una línea por acabado; el comprador escoge uno. La galería admite hasta diez imágenes. Las categorías ocultas retiran sus muebles de la tienda. Archivar conserva los registros históricos. El modo Fabricación a pedido evita descontar existencias; para stock controlado, la compra descuenta unidades dentro de una transacción.

## Pedidos

El comprador puede navegar y guardar una bolsa sin cuenta. Confirmar un pedido exige una sesión activa. El servidor vuelve a validar productos, acabados, precios, cupón, envío y existencias. Reintentar la misma confirmación no crea otro pedido.

Pedidos permite buscar por nombre, correo o número, filtrar estado, abrir el detalle, actualizar estado y pago, añadir una nota visible al cliente e imprimir el resumen. Exportar CSV descarga hasta 5000 pedidos recientes. Las cancelaciones reponen una sola vez el stock reservado; no se reabren los pedidos cancelados o entregados.

Los métodos iniciales son transferencia, Yape y efectivo a coordinar. **No hay una pasarela ni cobros automáticos**. Marcar como pagado solo registra una comprobación manual. Reembolsado tampoco ejecuta una operación bancaria. El resumen no es un comprobante fiscal.

## Clientes y equipo

Clientes permite editar datos y desactivar cuentas. Una cuenta desactivada pierde acceso. El propietario puede crear administradores y cambiar permisos. Los administradores gestionan la tienda, pero no gestionan accesos del equipo. La contraseña de una cuenta puede cambiarse desde su ficha; cambiarla invalida sus sesiones. No se puede quitar el acceso al propietario desde el panel.

## Imágenes y contenido

Imágenes permite seleccionar hasta 20 fotos por lote, de hasta 5 MB y 25 megapíxeles cada una. El navegador reduce el tamaño antes de enviarlas cuando es compatible y muestra el progreso de cada archivo. Se envían dos fotos simultáneamente; si alguna falla, Reintentar pendientes conserva las que ya se guardaron. La biblioteca se actualiza una vez al terminar cada lote. El servidor los convierte en WebP de hasta 1600 px. Puedes editar el título y texto alternativo y copiar su ruta. Los selectores de productos y portada usan miniaturas de esa biblioteca. Después de subir en otra pestaña, pulsa Actualizar biblioteca: se actualizan las opciones sin recargar el editor ni perder sus textos.

Cada tarjeta permite Eliminar. Se pide confirmación y se comprueba su uso; las imágenes vinculadas a productos, galerías, portada, categorías, páginas o pedidos deben conservarse o reemplazarse antes. Las imágenes sin referencias se retiran de la biblioteca junto con el original y la miniatura. Un pedido histórico puede seguir necesitando una imagen aunque la ficha del producto se haya editado.

Páginas y SEO permite guardar borradores, publicar texto y definir descripción para buscadores. El contenido es texto, con saltos de línea; no ejecuta HTML. Diseño y tienda edita la portada, textos, datos y envío. La franja superior de anuncios se retiró. Los cambios publicados regeneran la copia pública y precargan las páginas afectadas. La navegación y las búsquedas no consultan la base de datos. Guardar un registro sin cambios no genera otra escritura o auditoría.

Cupones permite definir código, descuento porcentual, compra mínima y vencimiento. El descuento se aplica al subtotal de productos. El servidor lo valida otra vez al confirmar.

Historial de cambios registra acciones de administración, incluyendo cambios de estado y de pago. Las sesiones, contraseñas y claves no se publican en ese historial.
