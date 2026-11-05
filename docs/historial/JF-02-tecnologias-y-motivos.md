# JF-02 — Tecnologías utilizadas y motivos de elección

- **Identificador:** JF-02
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; actualización de Next.js documentada en la entrega inicial.

## Cómo interpretar las versiones

Las versiones de esta tabla se obtuvieron del `package-lock.json` consultado para redactar el historial. `package.json` permite algunos rangos; el archivo de bloqueo concreta lo instalado. La imagen Docker utiliza la familia Node 22, sin fijar aquí un parche de imagen que no se haya comprobado.

| Tecnología | Versión registrada | Uso concreto y motivo |
| --- | --- | --- |
| React y React DOM | 19.3.1 | Componentes e interacción: bolsa, formularios, menú, edición y filtros. Responde al requisito explícito de React. |
| Next.js | 16.4.5 | Rutas, componentes de servidor, API HTTP, generación estática, invalidación por etiquetas y salida standalone en una sola aplicación. |
| TypeScript | 5.9.3 | Tipos compartidos para productos, pedidos, publicación y formularios; permite detectar incompatibilidades antes de desplegar. |
| Node.js | dependencia local 22.23.4 | Ejecuta herramientas y servidor. Se añadió un ejecutable local para trabajar con Node 22 aunque el Node global del host fuese anterior. |
| PostgreSQL | imagen 17-bookworm | Persistencia relacional, restricciones únicas, transacciones y control del inventario concurrente. Fue solicitado expresamente. |
| Prisma Client y CLI | 6.19.0 | Acceso tipado a PostgreSQL, esquema y migraciones versionadas. |
| Zod | 4.6.7 | Validación de entradas reales de la API: precios, cantidades, UUID, permisos y opciones. |
| bcryptjs | 3.0.3 | Hash de contraseñas y comprobación de acceso. Evita guardar contraseñas en texto. |
| sharp | 0.35.5 | Decodifica, orienta, limita y transforma imágenes subidas a WebP. |
| lucide-react | 0.468.0 | Iconos coherentes de navegación, compras y administración mediante componentes SVG. |
| Docker y Compose | configuración del repositorio | Construcción reproducible, aislamiento de servicios, red interna y persistencia mediante volúmenes. |
| Nginx | proxy compartido del servidor | Entrada HTTPS, redirección de HTTP, proxy al contenedor y tratamiento de archivos estáticos. |
| Certbot / certificados TLS | procedimiento compartido del servidor | Emisión y renovación del certificado del dominio. No es una dependencia npm de la aplicación. |
| Vitest | 5.0.3 | Pruebas rápidas de validación y reglas de entrada. |
| Vite | 8.3.4 | Dependencia del entorno de pruebas de Vitest; el sitio de producción se compila con Next.js. |
| Playwright Test | 1.64.1 | Pruebas reales en navegador, compra, administración, adaptación de tamaños y permisos. |
| Prettier | 3.6.2 | Formato del código durante el desarrollo. |
| tsx | 4.23.15 | Ejecuta scripts TypeScript de seed y exportación de la publicación. |

## Dependencias auxiliares y ajustes

Se fijaron overrides para `effect` 3.22.2 y `deepmerge-ts` 8.0.2, dependencias transitivas relacionadas con el conjunto de herramientas. Se hizo durante la revisión de dependencias de la entrega inicial; no son servicios de la tienda.

La instalación utiliza `npm ci --legacy-peer-deps`. Durante la preparación se encontró un fallo de resolución de dependencias pares; la configuración comprobada quedó bloqueada en `package-lock.json`. No se usa ese parámetro como sustituto de comprobar compilación y pruebas.

## Decisiones adicionales

La presentación utiliza CSS propio y fuentes del sistema/serif de reserva. La paleta y los estilos están en `src/app/globals.css`. No se incorporó una biblioteca de animaciones ni una dependencia remota de fuentes para poder mostrar el contenido.

Las fotografías iniciales se descargaron al proyecto. La navegación no necesita conectarse a Unsplash para mostrar esos archivos. Next y sharp realizan tareas diferentes: Next sirve variantes para el dispositivo y sharp normaliza las subidas.

## Fuentes del inventario

- [Dependencias y comandos](../../package.json).
- [Versiones resueltas](../../package-lock.json).
- [Construcción del contenedor](../../Dockerfile).
- [Servicios y volúmenes](../../docker-compose.yml).
- [Configuración de Next.js](../../next.config.mjs).

La elección de tecnologías se documenta por su uso real en este proyecto. No implica que todas sean necesarias para cualquier tienda ni una comparación de rendimiento con herramientas que no se probaron.
