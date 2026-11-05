# JF-19 — Migración al repositorio jham-or y organización de archivos

- **Identificador:** JF-19
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** 0614d4d.

## Situación anterior

La implementación inicial estaba en `/home/sistemas/Jham-or`, con un repositorio Git local. Algunos registros de trabajo se habían guardado como archivos `Jham-or-*.log` y JSON sueltos en `/home/sistemas`. Las copias iniciales se encontraban en un directorio de despliegues.

El usuario pidió reunir el proyecto en el repositorio nuevo `jham-or`, creado en `/home/sistemas/jham-or` con remoto `git@github.com:victovictorio00/jham-or.git`.

## Integración del historial

El repositorio nuevo contenía un commit inicial con README. Se importó el historial de implementación y se integraron ambos historiales, en lugar de sobrescribir el remoto o perder las decisiones anteriores.

El conflicto de README se resolvió conservando la documentación completa de la aplicación. El commit de integración tiene como antecedentes el inicio del repositorio nuevo y los commits de implementación.

No se utilizó un push forzado para sustituir el historial remoto.

## Archivos reunidos

| Destino actual | Contenido |
| --- | --- |
| `/home/sistemas/jham-or` | Código, configuración, documentación y repositorio principal. |
| `var/logs/legacy` | Registros sueltos de la primera implementación trasladados desde el directorio del usuario. |
| `var/logs` | Registros de verificaciones, compilación y despliegue posteriores. |
| `var/backups` | Copias locales de datos e imágenes/publicación. |
| `var/previous-repository.git` | Conservación local de los metadatos del repositorio anterior, excluida de Git del proyecto. |

Se retiró el directorio de trabajo anterior una vez trasladado su contenido. Los archivos privados y los artefactos locales no se subieron como código.

## Rutas y tareas programadas

Se actualizaron scripts, documentación y crontab para utilizar la ruta en minúsculas. Las tareas de copia y mantenimiento dejaron de depender del directorio anterior.

El proyecto Compose siguió llamándose `jhamor`. Esto conservó los nombres y contenidos de sus volúmenes. La base de datos y los archivos subidos no se reinicializaron por el traslado del código.

## Qué pertenece al repositorio y qué a la infraestructura

La configuración fuente de Nginx está en `infra/nginx.conf`. Su copia activa y los certificados se integran en el proxy compartido del servidor. Los volúmenes físicos son administrados por Docker.

Reunir el proyecto en el repositorio no implica versionar contraseñas, bases de datos, archivos de copias o claves TLS. Tampoco implica trasladar el proxy de los demás sitios a la aplicación de Jham-or.

## Resultado

El cambio se subió a `main` como `0614d4d`. Se comprobó el estado saludable de Jham-or y que Auriel seguía respondiendo HTTP 200.

- [Repositorio](https://github.com/victovictorio00/jham-or).
- [Commit de integración](https://github.com/victovictorio00/jham-or/commit/0614d4d).
- [Rutas de despliegue](../../scripts/deploy.sh).
- [Exclusiones locales](../../.gitignore).
