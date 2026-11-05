# JF-14 — Seguridad aplicada y revisión de dependencias

- **Identificador:** JF-14
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; mecanismo interno de arranque incorporado en 0614d4d.

## Controles implementados

| Área | Control y motivo |
| --- | --- |
| Contraseñas | Hash bcrypt y verificación de la contraseña actual al cambiar la propia. |
| Sesiones | Tokens aleatorios, hash del token en base de datos, expiración y revocación. |
| Cookies | HttpOnly, SameSite=Lax y Secure en producción. |
| Permisos | Comprobaciones en páginas privadas y endpoints antes de consultar o mutar recursos protegidos. |
| Origen | Las mutaciones normales exigen un `Origin` igual a `SITE_URL`. |
| Intentos | Contadores persistidos en PostgreSQL para acceso, registro, pedidos, cotización y subidas según la ruta. |
| SQL | Prisma y consultas crudas parametrizadas; los valores del usuario no se concatenan como SQL. |
| Formularios | Zod valida tipos, límites, opciones y relaciones de importes. |
| Redirecciones | Destinos de retorno internos filtrados mediante `safeNext`. |
| Imágenes | Límite de tamaño/píxeles, transformación a WebP y nombres generados. |
| Datos públicos | Exportación explícita sin usuarios, sesiones, pedidos ni hashes. |
| Infraestructura | Usuario de aplicación sin privilegios y servicios dentro de redes Docker. |

## Limitación de intentos

`RateLimit` usa un upsert SQL parametrizado para incrementar el contador o iniciar una nueva ventana de 15 minutos. El acceso/registro limita por correo y por dirección recibida del proxy; otras rutas privadas usan claves de usuario.

Nginx también aplica una zona de límites a los endpoints de acceso y registro. La dirección transmitida al servidor debe proceder de la configuración del proxy; no se documenta como una identidad verificable de la persona.

## Cabeceras

La aplicación configura restricciones de contenido, tipo de archivo, framing y referente. La política de contenido permite los scripts y estilos inline que utiliza la aplicación; no se presenta como una política sin excepciones.

Nginx incorpora la configuración de seguridad compartida y TLS. La seguridad de sesión depende también de mantener `SITE_URL` y `COOKIE_SECURE` correctamente configurados.

## Preparación interna

El arranque genera un token aleatorio efímero para `/api/internal/prepare`. La ruta compara hashes con `timingSafeEqual`, no utiliza una clave pública fija y no depende de la contraseña del propietario. Se usa para preparar la publicación y no para el acceso de clientes.

La excepción interna al control normal de origen requiere ese token. Una petición externa sin él no obtiene autorización para preparar la publicación.

## Revisión inicial de dependencias

Se detectaron avisos en la versión de Next.js inicialmente tomada como referencia y se actualizó a 16.4.5 antes de publicar. También se fijaron overrides de dependencias transitivas. El informe de auditoría de producción de aquella entrega registró cero vulnerabilidades conocidas.

Ese resultado describe una comprobación histórica, no una garantía permanente ni una auditoría de seguridad completa. El inventario actual documentado está en [JF-02](JF-02-tecnologias-y-motivos.md).

## Exclusión de secretos

`.env`, `.env.test`, `ACCESO_ADMIN.txt`, copias, registros y artefactos locales se excluyen de Git. `.dockerignore` excluye los archivos de credenciales del contexto de construcción. Solo se permite el artefacto público necesario para compilar la tienda estática.

No deben añadirse contraseñas, tokens, claves TLS ni datos personales de clientes a este historial.

- [Sesiones y origen](../../src/lib/auth.ts).
- [Validaciones](../../src/lib/validation.ts).
- [Configuración de Next.js](../../next.config.mjs).
- [Exclusiones de Git](../../.gitignore).
- [Exclusiones de Docker](../../.dockerignore).
