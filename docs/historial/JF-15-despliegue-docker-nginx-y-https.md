# JF-15 — Despliegue con Docker, Nginx y HTTPS

- **Identificador:** JF-15
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; volúmenes y arranque estático ampliados en 0614d4d.

## Alojamiento elegido

El usuario confirmó `jhamor.purprum.com`, Nginx y el servidor existente. Se utilizó el proxy compartido con otros proyectos y una aplicación y PostgreSQL independientes para Jham-or.

El proyecto Compose se identifica explícitamente como `jhamor`. Conservar ese nombre al cambiar de carpeta permite seguir utilizando los volúmenes de datos existentes.

## Servicios, red y puertos

| Elemento | Configuración |
| --- | --- |
| Aplicación | Next standalone, puerto 3012 dentro de Docker, alias `jhamor-web` en la red del proxy. |
| PostgreSQL | Imagen `postgres:17-bookworm`, base y usuario de proyecto, alias privado `jhamor-db`. |
| Acceso PostgreSQL del host | Puerto 55433 ligado a `127.0.0.1`. |
| Red pública de entrada | Nginx escucha HTTP/HTTPS; la aplicación no publica su puerto directamente a Internet en Compose. |
| Pool | La URL de aplicación configura `connection_limit=10` y `pool_timeout=10`. |

El alias exclusivo de base de datos corrigió una ambigüedad inicial: varios servicios del servidor podían anunciarse como `postgres`. Utilizar `jhamor-db` identifica la base correcta dentro de las redes conectadas.

## Construcción de la imagen

El Dockerfile separa base, dependencias, compilación y ejecución. Instala certificados/soporte OpenSSL, utiliza el lockfile, genera Prisma y compila Next.

La etapa de ejecución copia la salida standalone, estáticos, fotografías, semilla pública y script de arranque. Ejecuta con el usuario `app`, no como root. Los directorios de publicación, subidas y caché de imágenes tienen propietario adecuado para escribir mediante ese usuario.

La copia pública preparada para compilar no contiene secretos y permite generar páginas sin consultar PostgreSQL durante el build.

## Nginx y TLS

La configuración fuente es `infra/nginx.conf`. El despliegue la instala en la configuración del proxy compartido. HTTP redirige a HTTPS y deja disponible la ruta de comprobación ACME. HTTPS utiliza el certificado del dominio, TLS 1.2/1.3 y HTTP/2.

Los archivos `/_next/static/` reciben caché larga inmutable. El proxy mantiene conexiones hacia la aplicación y permite compresión de los tipos configurados.

El certificado se emitió inicialmente con vencimiento el 3 de febrero de 2027 y se añadió al procedimiento existente de renovación. Esa fecha identifica el certificado inicial; no sustituye comprobar el certificado vigente después de sus renovaciones.

## Flujo de despliegue actual

`scripts/deploy.sh` aplica migraciones, exporta el contenido público para compilar, construye la imagen, actualiza la aplicación esperando salud/precarga, instala Nginx, valida su sintaxis y recarga el proxy.

Los comandos de producción parten de `/home/sistemas/jham-or`. Las claves se mantienen fuera del repositorio y no se incluyen en argumentos públicos del historial.

## Infraestructura compartida

Los archivos activos del proxy y del certificado permanecen en la infraestructura compartida del servidor. El código fuente de la configuración pertenece al repositorio nuevo. No se movieron ni reinicializaron los datos de otros proyectos.

- [Dockerfile](../../Dockerfile).
- [Compose](../../docker-compose.yml).
- [Configuración del proxy](../../infra/nginx.conf).
- [Despliegue](../../scripts/deploy.sh).
