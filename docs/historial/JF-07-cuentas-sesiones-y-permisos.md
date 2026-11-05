# JF-07 — Cuentas, sesiones y permisos de acceso

- **Identificador:** JF-07
- **Fecha de documentación:** 2026-11-05
- **Tipo de registro:** retrospectivo, contrastado con el código conservado
- **Origen principal:** b258773; rutas privadas conservadas en 0614d4d.

## Regla comercial

Explorar muebles y preparar una bolsa no exige cuenta. Entrar al checkout y confirmar un pedido sí exige una sesión válida. Esta regla se aplica tanto en la página como en la API; ocultar un botón no sería suficiente.

## Registro y acceso

El registro solicita nombre, correo, teléfono y contraseña. El cliente repite la contraseña antes de enviar el registro. El servidor valida los campos, convierte el correo a minúsculas y utiliza su restricción única para impedir duplicados.

Las contraseñas admitidas tienen de 12 a 128 caracteres y se almacenan mediante bcrypt con coste 12. El acceso compara el hash y devuelve un error genérico cuando las credenciales no son válidas o la cuenta está deshabilitada.

## Sesión

Al iniciar sesión se generan 32 bytes aleatorios. El navegador recibe el token mediante `jhamor_session`; PostgreSQL conserva su hash SHA-256 y un vencimiento de siete días.

La cookie es HttpOnly, SameSite=Lax y Secure en producción. Su dominio no se amplía deliberadamente a todos los subdominios. La aplicación comprueba el vencimiento y la actividad del usuario al autorizar una petición privada.

Cerrar sesión elimina la sesión correspondiente y la cookie. Cambiar la contraseña invalida sesiones anteriores y permite crear la nueva sesión del usuario que la modifica.

## Permisos

| Rol | Capacidades principales |
| --- | --- |
| `CUSTOMER` | Comprar y consultar los pedidos pertenecientes a su cuenta; editar sus datos. |
| `ADMIN` | Gestionar los recursos comerciales autorizados del panel y editar clientes; sin administrar los accesos del equipo. |
| `OWNER` | Capacidades administrativas y gestión de cuentas del equipo y sus permisos. |

La API comprueba el rol antes de mutar recursos. La sección Equipo también comprueba el propietario antes de leer sus datos. No se permite quitar el acceso del propietario mediante las operaciones protegidas del panel.

## Perfil y aislamiento

Mi cuenta permite editar nombre y teléfono. Un cambio de contraseña propia exige la contraseña actual. Las páginas de pedidos filtran por identificador y usuario, de modo que conocer un UUID de otra compra no concede acceso.

`safeNext` permite redirecciones internas y rechaza destinos externos, rutas que empiezan por `//` y variantes con barra invertida.

## Consultas necesarias

Las sesiones y los permisos siguen consultándose en peticiones privadas. La generación estática se aplica a la tienda pública; no se utiliza para compartir perfiles o permisos entre visitantes.

- [Autenticación y autorización](../../src/lib/auth.ts).
- [API de cuentas](<../../src/app/api/[...path]/route.ts>).
- [Formularios](../../src/components/forms.tsx).
- [Límites actuales](JF-23-alcance-actual-y-pendientes.md).
