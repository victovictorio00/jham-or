# JF-22 — Copias de seguridad, salud y mantenimiento

- **Identificador:** JF-22
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; rutas y copia de publicación actualizadas en 0614d4d.

## Qué debe conservarse

| Volumen | Contenido | Tratamiento |
| --- | --- | --- |
| `jhamor_postgres_data` | Datos comerciales, cuentas, sesiones y revisiones | Copia mediante `pg_dump`, no copia en caliente de archivos internos. |
| `jhamor_uploads` | Imágenes subidas por el equipo | Archivo comprimido de los archivos. |
| `jhamor_publication` | Copia pública persistida | Archivo comprimido para conservar el estado publicado. |
| `jhamor_image_cache` | Variantes optimizadas regenerables | Caché de rendimiento; el script no la trata como copia comercial imprescindible. |

La configuración privada y los certificados necesitan una conservación operativa propia. El script de copias del proyecto no documenta una copia automática de todos los secretos del servidor.

## Script de copia

`scripts/backup.sh` utiliza `pg_dump -Fc` para PostgreSQL y archivos `tar.gz` para imágenes y publicación. Los nombres llevan una fecha UTC para distinguir ejecuciones.

La base se escribe primero en un archivo temporal y se renombra al completarse. La carpeta de destino tiene permisos 700 y los archivos 600. Los contenedores auxiliares que escriben en la carpeta usan el UID/GID del operador.

El destino por defecto es `/home/sistemas/jham-or/var/backups`, modificable mediante `JHAMOR_BACKUP_DIR`. No se sube a Git.

## Programación registrada

- 04:00: copia diaria mediante `scripts/backup.sh`.
- 04:10: limpieza mediante `scripts/maintenance.mjs`.

Son horarios del servidor. El script usa UTC para el nombre del archivo; eso no convierte automáticamente la programación de cron en UTC.

## Limpieza de registros caducados

El mantenimiento elimina sesiones vencidas y ventanas de límites de intentos vencidas. No borra clientes, productos o pedidos históricos y no necesita regenerar el catálogo por esa limpieza.

No se ha implementado aquí una política automática general de retención que borre copias antiguas o envíe archivos a un almacenamiento externo.

## Salud

PostgreSQL tiene una comprobación `pg_isready`. La aplicación utiliza `/api/health`, que en arranque gestionado comprueba la marca de precarga y después ejecuta `SELECT 1`.

Un proceso HTTP que ya escucha no se considera listo si todavía no ha completado la precarga prevista. El despliegue espera el estado saludable antes de finalizar su fase de actualización.

## Restauración comprobada y límites

En la primera entrega se restauró una copia PostgreSQL en una base temporal y se comprobaron 6 productos, 1 propietario y 0 pedidos antes de retirar esa base. Eso demuestra aquella prueba de restauración, no una certificación permanente de cualquier copia futura.

Las copias locales permanecen en el mismo servidor: una pérdida total del host también puede afectarlas. Conservar una copia externa requiere un destino y una operación adicionales; no se presenta como algo ya configurado.

- [Copias](../../scripts/backup.sh).
- [Mantenimiento](../../scripts/maintenance.mjs).
- [Salud y volúmenes](../../docker-compose.yml).
- [Arranque](../../scripts/start.mjs).
