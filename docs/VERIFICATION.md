# Verificación — 5 de noviembre de 2026

Publicado: https://jhamor.purprum.com. Panel: https://jhamor.purprum.com/admin.

## Resultado

- Compilación de producción y TypeScript correctos con Next.js 16.4.5, React 19 y Prisma 6.19.0.
- 7 pruebas de validación aprobadas.
- 7 pruebas E2E aprobadas (21,7 s), contra la misma imagen Docker publicada, sobre la base independiente `jhamor_test`.
- Las pruebas cubren catálogo y filtros, bolsa persistente, registro y autenticación, protección administrativa y de origen, compra, aislamiento de pedidos entre cuentas, stock concurrente, idempotencia, cancelación única, publicación de cambios, guardados sin cambios de productos y configuración (incluyendo timestamps y auditoría), cupones, fabricación a pedido, subida y conversión de imágenes y exportación CSV.
- Revisión en producción: 46 combinaciones de página y tamaño, sin errores de JavaScript ni desbordamiento horizontal. Tienda en 360, 390, 768 y 1440 px; panel en 390 y 1440 px.
- Cookie de producción comprobada: HttpOnly, Secure y SameSite=Lax.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas al verificar. Las dependencias de producción se actualizaron antes de publicar.
- Nginx válido, HTTPS y healthcheck correctos; aplicación y PostgreSQL saludables. Auriel continúa respondiendo HTTP 200.

## Rendimiento

Informe: [performance.json](performance.json). Se calentaron cinco rutas públicas y se hicieron quince peticiones HTML completas por ruta, desde este servidor al dominio HTTPS. Se contó el incremento de consultas sobre Product, Category, Setting y Page mediante `pg_stat_statements` de la base de producción. No hubo escrituras simultáneas durante esta medición.

| Ruta | Peticiones después de calentar | Consultas adicionales de catálogo/contenido | Mediana de respuesta completa |
| --- | ---: | ---: | ---: |
| Inicio | 15 | 0 | 54,7 ms |
| Catálogo | 15 | 0 | 35,9 ms |
| Detalle del sofá | 15 | 0 | 35,7 ms |
| Nosotros | 15 | 0 | 31,8 ms |
| Términos | 15 | 0 | 31,6 ms |

La sesión y los permisos se validan en cada petición privada; no se pretende eliminar esas comprobaciones. El catálogo se invalida al cambiar productos, categorías o stock. Las compras y cancelaciones se validan contra PostgreSQL dentro de transacciones, aunque la ficha pública tenga una copia en caché.

Muestra móvil de navegador: [production-browser.json](production-browser.json), 390 px, caché vacía, latencia 150 ms, descarga 1,6 Mbps y CPU limitada a 4×. LCP observado: 1.332 ms. CLS: 0. Es una muestra sintética desde este entorno, no datos de usuarios reales ni una garantía para todas las redes.

## Despliegue y operaciones

Imagen probada/publicada: `sha256:b41f26b9d2c28e063c460609e4ae3b16f5dbed97f2e6f841bfa1a812691b8150`.

Compose: proyecto `jhamor`; PostgreSQL aislado y volumen propio de imágenes. La base usa el alias privado `jhamor-db` para evitar ambigüedad con los PostgreSQL de otros proyectos. El contenedor de aplicación se ejecuta como usuario `app` sin privilegios, y no contiene archivos de credenciales. No publica puertos de aplicación hacia Internet; Nginx la alcanza por la red interna.

Certificado emitido para `jhamor.purprum.com`, con vencimiento inicial el 3 de febrero de 2027. El dominio se añadió al procedimiento existente de renovación, ejecutado por `auriel-certificates.timer`, comprobado activo.

Copias en `/home/sistemas/deployments/jhamor-backups`, con directorio privado y archivos modo 600. Se hizo una copia de PostgreSQL y del volumen de imágenes y se restauró PostgreSQL en una base temporal; se comprobaron 6 productos, 1 propietario y 0 pedidos. La base temporal se eliminó tras la prueba. Copia diaria programada a las 04:00 y limpieza de sesiones y límites caducados a las 04:10, hora del servidor. Las copias son locales a este servidor; conviene conservar también una copia externa.

La base publicada conserva solamente los seis muebles de muestra y la cuenta inicial de propietario. Los pedidos y clientes creados por las pruebas están en `jhamor_test`. El contenedor temporal de pruebas se retiró al terminar.

## Datos por completar

El catálogo, las fotos y los precios iniciales son de muestra. El propietario debe sustituirlos por su oferta real y completar contacto, cobertura, tarifa de entrega y condiciones comerciales. Las páginas de información contienen textos iniciales que requieren los datos definitivos del negocio.

Los pedidos usan pago coordinado por transferencia, Yape o efectivo. No hay una pasarela automática, emisión fiscal ni correo de recuperación configurado. El propietario puede cambiar contraseñas desde el panel y cada usuario puede cambiar su contraseña desde Mi cuenta. Las confirmaciones y el seguimiento quedan disponibles en la cuenta del cliente.
