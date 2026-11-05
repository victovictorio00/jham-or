# JHAM-OR

Tienda de muebles en React 19, Next.js 16.4.5, Prisma 6 y PostgreSQL 17. Producción con Docker y Nginx: https://jhamor.purprum.com.

Proyecto independiente en `/home/sistemas/Jham-or`. PostgreSQL, usuarios, sesiones, pedidos y archivos separados de Auriel. Nginx se comparte con los otros sitios del servidor por la red Docker `auriel_internal`.

## Desarrollo

Usa Node 22. La instalación incluye un ejecutable local en `node_modules/node/bin/node`; añade su carpeta al PATH si el Node del sistema es más antiguo.

```bash
npm ci --legacy-peer-deps
export PATH="$PWD/node_modules/node/bin:$PATH"
cp .env.example .env
# Completa las claves antes de continuar.
docker compose -p jhamor up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

La configuración local de ejemplo utiliza `http://localhost:3012` y cookie no Secure. Docker fija `SITE_URL=https://jhamor.purprum.com` y cookie Secure. Nunca uses las claves de ejemplo en producción. El seed hace upsert sin sobrescribir registros existentes y no debe ejecutarse como parte de cada despliegue.

## Publicar

```bash
npm run typecheck
npm run test
npm run build
# Ejecuta las migraciones pendientes antes de desplegar cambios de esquema.
docker compose -p jhamor up -d --build app
```

El contenedor ejecuta la salida standalone de Next como usuario sin privilegios, publica el puerto 3012 solo en su red Docker y monta un volumen para imágenes. El PostgreSQL usa el alias privado único `jhamor-db` y solo se expone a loopback por 55433, con pool de diez conexiones de aplicación. No hay secretos en el repositorio ni en la imagen.

Nginx: `/home/sistemas/Auriel/infra/nginx/jhamor.conf`, incluido desde `nginx.conf`. TLS usa `/home/sistemas/Auriel/infra/tls/jhamor.purprum.com/`; la renovación usa el procedimiento compartido de Auriel. Comprueba `nginx -t` antes de recargar.

## Verificación

`npm test` valida límites de compras, importes y redirecciones. `npm run test:e2e` cubre navegación, móvil, registro, bolsa, compra, permisos, stock concurrente, idempotencia, cancelación y edición administrativa. Ejecútalo únicamente con `DATABASE_URL` de `jhamor_test`, cargando `.env.test`; crea pedidos y productos de prueba. Nunca apuntes la suite a producción.

`scripts/performance.mjs` mide respuestas HTML y el aumento de consultas públicas con `pg_stat_statements`; el informe se guarda en `docs/performance.json`. Necesita la extensión y debe ejecutarse sin ediciones simultáneas, que invalidarían la caché. Los tiempos son del servidor, no una promesa de rendimiento en cualquier red.

## Caché y seguridad

Las tarjetas del catálogo contienen únicamente datos para listados; la descripción y galería se consultan por slug al abrir la ficha. Las consultas son paginadas (24 públicas, 30 en administración); el dashboard utiliza agregados y lecturas acotadas. No hay polling de listados ni una consulta de sesión por cada página pública. Se deduplican lectores en el render y se cachean datos públicos por etiqueta: catálogo (300 s), ajustes y páginas (hasta modificación). Las compras y cancelaciones solo invalidan catálogo si cambian stock. Clientes, pagos y auditoría no invalidan catálogo.

Los permisos se comprueban antes de consultar datos privados y en cada mutación; las sesiones privadas no usan caché compartida. Cookies HttpOnly/SameSite/Secure, hashes bcrypt, tokens de sesión aleatorios con hash SHA-256, validación de origen, límites de intentos persistidos en PostgreSQL, SQL parametrizado y límites de imágenes. La compra usa aislamiento Serializable y reintentos de conflicto; valida todo en PostgreSQL. Los pedidos guardan una copia histórica de precios, productos, acabados y plazos.

## Operación

Conserva copias de PostgreSQL (`pg_dump`) y del volumen de imágenes. Prueba la restauración periódicamente. `scripts/maintenance.mjs` elimina sesiones y límites de intentos caducados; puede programarse una vez al día, cargando `.env` desde este proyecto.

Consulta [la guía del panel](docs/ADMIN.md) y [la verificación](docs/VERIFICATION.md).
