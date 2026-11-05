# JF-21 — Cronología de commits y correcciones realizadas

- **Identificador:** JF-21
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** historial Git conservado y registros de desarrollo disponibles.

## Cómo leer esta cronología

La implementación se registró en commits amplios. Los documentos JF separan temas para poder consultarlos, pero no representan un commit por archivo ni una hora independiente de implementación.

Las horas siguientes están normalizadas a UTC. El commit inicial del repositorio nuevo fue creado después de los commits locales de la implementación, aunque también sea un “Initial commit”.

| Fecha UTC | Commit | Hecho respaldado |
| --- | --- | --- |
| 2026-11-05 02:43:19 | `b258773` | Primera implementación completa de tienda, panel, reglas de compra, PostgreSQL, infraestructura, imágenes y pruebas. |
| 2026-11-05 02:47:24 | `9cab4ef` | Corrección de guardados de configuración sin cambios y verificación de producción. |
| 2026-11-05 05:15:42 | `5698327` | Commit inicial del repositorio `jham-or` proporcionado después por el usuario. |
| 2026-11-05 05:34:03 | `0614d4d` | Integración de historiales, traslado al repositorio nuevo, retirada de franja, publicación estática, precarga, recuperación y nuevas pruebas. |

## Correcciones incorporadas durante la primera entrega

| Situación encontrada | Corrección y resultado |
| --- | --- |
| Node global anterior al utilizado por el proyecto | Uso de Node 22 mediante contenedor/herramienta local. |
| Fallo de resolución de dependencias pares en npm | Instalación comprobada con `--legacy-peer-deps` y lockfile. |
| Archivos de instalación con propietario distinto | Ajuste de permisos del entorno de trabajo para poder generar el cliente y compilar. |
| Avisos de seguridad en dependencias iniciales | Actualización de Next.js y overrides antes de publicar. |
| Desbordamiento del registro móvil | Ajustes de ancho mínimo y columnas del formulario. |
| Enlace de bolsa con semántica incorrecta | Retirada del rol que sustituía su semántica de enlace. |
| Conversión de céntimos duplicada en el editor | Corrección para que S/ 199,90 se guarde como 19990 céntimos, no multiplicado de nuevo. |
| Alias genérico `postgres` ambiguo entre proyectos | Alias privado `jhamor-db` y URL de conexión correspondiente. |
| Fixture PNG inválido en una prueba de subida | Sustitución por una imagen de prueba válida; la validación de imágenes seguía siendo correcta. |
| Configuración igual con orden de claves diferente | Comparación de valores por campo y salida sin escritura. |

Estas correcciones se consolidaron en las entregas indicadas. No se inventan commits intermedios que no existen.

## Cambio posterior solicitado por el usuario

Se retiró la franja verde y se sustituyó la lectura SQL pública con renovación de cinco minutos por una publicación persistida, HTML estático y filtros en el navegador. Se añadieron revisiones transaccionales, precarga y recuperación tras interrupción.

Se trasladaron código, registros y copias al repositorio nuevo; se actualizaron rutas y tareas programadas. Se preservaron los datos y se subió la integración a `main`.

## Incidencia del entorno de medición

Un reset de la base de pruebas retiró `pg_stat_statements`, por lo que una medición falló al faltar la extensión. Se recreó la extensión en `jhamor_test` y se repitió la prueba específica con resultado correcto. No se presentó esa ausencia de instrumentación como una regresión de la aplicación.

## Documentación histórica añadida después

La petición de organizar archivos Markdown `JF-XX-titulo.md` origina esta carpeta y su procedimiento de continuidad; ver [JF-24](JF-24-documentacion-y-registro-de-futuros-cambios.md). El commit de esta documentación puede localizarse en Git después de guardarla; no se anticipa aquí un hash todavía desconocido.

## Fuentes

- [Primera implementación](https://github.com/victovictorio00/jham-or/commit/b258773).
- [Corrección de guardados](https://github.com/victovictorio00/jham-or/commit/9cab4ef).
- [Inicio del repositorio nuevo](https://github.com/victovictorio00/jham-or/commit/5698327).
- [Integración y publicación estática](https://github.com/victovictorio00/jham-or/commit/0614d4d).

Los registros locales conservados en `var/logs` sirven como apoyo operativo y están excluidos de Git. No se copian sus posibles datos sensibles a la documentación pública.
