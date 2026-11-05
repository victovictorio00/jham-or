# JF-24 — Documentación histórica y registro de futuros cambios

- **Identificador:** JF-24
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** documentación de esta incorporación
- **Origen principal:** petición actual de documentación; base previa 0614d4d.

## Solicitud atendida

Se pidió crear una carpeta que explicara con detalle los cambios desde la creación, las tecnologías, sus motivos y el funcionamiento del proyecto. Se aclaró que cada nombre debe empezar por el identificador y continuar con un título reconocible, por ejemplo `JF-02-tecnologias-y-motivos.md`.

Se creó `docs/historial` con un índice y 24 documentos numerados. Cada archivo empieza por un título como `# JF-02 — Tecnologías utilizadas y motivos de elección`. Todos los archivos de esta carpeta son Markdown.

## Alcance de esta incorporación

- Reconstrucción retrospectiva del alcance y de las entregas conservadas.
- Inventario de tecnologías y versiones concretas del lockfile.
- Explicación de estructura, datos, reglas comerciales y seguridad.
- Diferenciación entre caché inicial y publicación estática posterior.
- Registro de precarga, recuperación, migración de repositorio e incidencias corregidas.
- Pruebas, métricas, infraestructura, copias y límites reales.
- Enlaces desde el README principal y reglas de continuidad en `AGENTS.md`.

Esta incorporación modifica documentación e instrucciones de trabajo, no la lógica de la tienda ni el esquema de datos. No requiere reconstruir o reiniciar la aplicación solo para que existan estos archivos en Git.

## Convención de nombres

```text
JF-25-titulo-descriptivo-del-siguiente-cambio.md
JF-26-otro-cambio-concreto.md
```

El próximo identificador disponible tras esta entrega es **JF-25**. Se amplía el número a tres cifras si se llega a 100, sin renombrar los anteriores.

Se usan minúsculas, guiones y palabras descriptivas en el nombre. El título dentro del archivo puede llevar tildes y debe mantener el mismo identificador. No se usan nombres genéricos como `cambio.md`, ni se reutiliza un número ya registrado.

## Contenido requerido en un registro futuro

1. Identificador y título.
2. Fecha del cambio o de documentación, distinguiéndolas cuando no coincidan.
3. Solicitud, problema o necesidad que lo originó.
4. Comportamiento anterior y comportamiento resultante.
5. Archivos, rutas, servicios o tablas afectados.
6. Decisión técnica y motivo.
7. Migración, configuración o procedimiento operativo necesario, si existe.
8. Comprobaciones ejecutadas y su resultado; indicar qué no se pudo comprobar.
9. Limitaciones o tareas pendientes relacionadas con el cambio.
10. Referencias a fuentes, evidencias y commits conocidos.

## Plantilla de contenido

```markdown
# JF-25 — Título concreto

**Identificador:** JF-25
**Fecha del cambio:** AAAA-MM-DD
**Tipo:** funcional / corrección / infraestructura / documentación
**Referencia:** commit conocido o indicación de que aún no está asignado

## Necesidad

## Cambios y comportamiento resultante

## Archivos y datos afectados

## Motivo técnico

## Validación y resultado

## Operación, límites y pendientes

## Referencias
```

## Reglas de continuidad

El identificador representa una unidad de cambio comprensible, no cada línea editada. Si una entrega tiene varias decisiones independientes, se pueden crear varios JF y relacionarlos con el mismo commit.

Se mantiene el índice al añadir archivos. Los registros previos no se renumeran para insertar uno nuevo. Una corrección factual de un documento debe ser explícita; un cambio de comportamiento posterior se registra como una entrada nueva que enlaza al antecedente.

No se inventan pruebas, fechas ni hashes. Se puede indicar “retrospectivo” cuando el código se escribió antes del registro. Nunca se incluyen contraseñas, sesiones, claves privadas, correos de clientes o copias comerciales.

## Qué significa mantener el historial

Las reglas de `AGENTS.md` indican que los próximos trabajos relevantes deben incorporar su JF antes de darse por terminados. No se instaló un generador automático de Markdown por cada guardado comercial ni un hook que convierta cualquier commit en una explicación técnica fiable.

La auditoría del panel y este historial son complementarios: una registra operaciones comerciales, el otro explica la evolución del software.

## Validación de esta entrega

Se comprueba que todos los identificadores estén presentes, sean únicos y consecutivos; que los nombres correspondan a sus encabezados; que la carpeta solo contenga Markdown y que sus enlaces locales resuelvan.

La comprobación es documental. No se presenta como una nueva ejecución de las pruebas de compra o rendimiento del sistema, cuyos resultados históricos se enlazan por separado.

- [Índice del historial](README.md).
- [Instrucciones del repositorio](../../AGENTS.md).
- [README principal](../../README.md).
