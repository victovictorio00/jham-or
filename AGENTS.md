# Instrucciones de trabajo de Jham-or

## Historial de cambios del proyecto

El usuario pidió mantener un historial detallado en `docs/historial/`.

- Antes de finalizar un cambio funcional, una corrección, una modificación de infraestructura, de datos, de seguridad o de documentación relevante, añade su registro Markdown al historial.
- Lee el índice y `docs/historial/JF-24-documentacion-y-registro-de-futuros-cambios.md` para aplicar la convención existente.
- Usa el siguiente número disponible y un título descriptivo en el nombre: `JF-25-titulo-del-cambio.md`. No reutilices ni renumeres identificadores anteriores.
- Empieza el contenido con el mismo identificador y un título legible: `# JF-25 — Título del cambio`.
- Explica la necesidad, el comportamiento anterior y el resultante, los archivos y datos afectados, el motivo de las decisiones, la validación real y cualquier procedimiento o limitación pertinente.
- Actualiza el índice de `docs/historial/README.md` y relaciona el nuevo registro con sus antecedentes cuando corresponda.
- Distingue una reconstrucción retrospectiva de un evento registrado al realizarse. No inventes fechas, commits, pruebas ni resultados. Si el commit aún no existe, no anticipes su hash.
- Conserva la diferencia entre el historial técnico Markdown y la auditoría de operaciones comerciales del panel.
- No incluyas contraseñas, tokens, claves TLS, datos de sesiones, clientes, pedidos reales ni contenido de copias privadas.

El alcance del cambio actual puede reunirse en un registro si representa una unidad coherente. Varias decisiones independientes pueden tener registros distintos y compartir commit. Una comprobación documental no equivale a ejecutar otra vez las pruebas funcionales históricas.
