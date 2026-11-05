# JF-20 — Pruebas funcionales y mediciones de rendimiento

- **Identificador:** JF-20
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773, 9cab4ef y 0614d4d; resultados conservados en docs.

## Conjuntos de pruebas

| Conjunto | Casos documentados | Cobertura |
| --- | ---: | --- |
| `tests/validation.test.ts` | 7 | Cantidades, dirección, importes no autoritativos del cliente, redirecciones, imágenes, envío y reglas terminales/ofertas. |
| `tests/e2e/commerce.spec.ts` | 7 | Navegación, filtros, bolsa, registro, compra, permisos, concurrencia, idempotencia, cancelación, panel, cupones, imágenes y exportación. |
| `tests/e2e/publication.spec.ts` | 2 | SQL público ante rutas/búsquedas nuevas y actualización real de HTML tras publicar o retirar contenido. |

La entrega documentada tiene 16 casos entre pruebas unitarias y E2E. Los bucles de tamaños y rutas aumentan las comprobaciones internas de esos casos; no se deben presentar como cientos de pruebas independientes.

## Entorno de prueba

Las pruebas comerciales modifican datos. Deben apuntar a `jhamor_test`, con una aplicación de prueba en el puerto local 3012 y una publicación separada de la producción. Necesitan datos iniciales coherentes, como las existencias de referencia del seed.

Para medir SQL se requiere `pg_stat_statements`. Restablecer el esquema de una base de pruebas puede retirar su extensión; debe comprobarse antes de ejecutar el caso que cuenta consultas. El reset no es una tarea de despliegue de producción.

## Comandos y condiciones

```bash
npm run typecheck
npm test
node --env-file=.env.test node_modules/@playwright/test/cli.js test
```

Estos comandos presuponen Node 22, dependencias instaladas y, para E2E, el entorno aislado ya preparado y sirviendo en el puerto esperado. No debe cambiarse su URL a la tienda comercial para “hacer que pasen”.

## Medición de SQL en producción

El informe `performance.json` incluye 105 respuestas HTML: 15 por cada una de siete URLs. Incluye la primera petición de cada URL medida, una búsqueda nueva y un filtro de categoría. El arranque de la aplicación había precargado el sitio; el verificador no calentó previamente cada URL.

Se compararon los contadores de consultas sobre `Product`, `Category`, `Setting`, `Page` y `PublicationState` de la base correspondiente. El incremento fue 0 y todas las respuestas medidas mostraron `x-nextjs-cache: HIT`.

| Ruta | Mediana HTTPS | Percentil alto registrado |
| --- | ---: | ---: |
| Inicio | 29,6 ms | 121,3 ms |
| Catálogo | 36,8 ms | 483,1 ms |
| Ficha del sofá | 29,2 ms | 48,7 ms |
| Nosotros | 29,3 ms | 119,8 ms |
| Términos | 27,6 ms | 33,6 ms |
| Búsqueda nueva | 29,4 ms | 39,1 ms |
| Categoría y precio | 31,8 ms | 53,4 ms |

Los tiempos incluyen la red hacia Cloudflare y varían. El script toma el último valor ordenado de 15 muestras para su campo `p95ms`; no es una distribución estadística extensa ni una garantía de latencia.

## Navegador y presentación

El verificador de producción recorrió 46 combinaciones de ruta y tamaño. Registró cero errores JavaScript, ausencia de desbordamientos y de franja superior, y las propiedades esperadas de cookie privada.

La muestra móvil usó 390 px, caché de navegador vacía, latencia simulada de 150 ms, descarga de 1,6 Mbps y CPU 4×. Registró LCP de 1292 ms y CLS 0. Es una muestra sintética del entorno, no Core Web Vitals de usuarios reales.

## Interpretación correcta

Cero consultas públicas no significa cero consultas de toda la aplicación. La sesión, la compra, el panel, la publicación y `SELECT 1` de salud tienen otras responsabilidades. Una medición de SQL tampoco debe ejecutarse a la vez que ediciones administrativas que legítimamente consultan esas tablas.

- [Pruebas](../../tests).
- [Medición HTTP y SQL](../../scripts/performance.mjs).
- [Informe HTTPS](../performance.json).
- [Informe de navegador](../production-browser.json).
- [Verificador de producción](../../scripts/verify-production.mjs).
