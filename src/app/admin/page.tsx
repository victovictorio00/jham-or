import Link from "next/link";
import { adminOverview } from "@/lib/admin-data";
import { adminPage } from "@/lib/auth";
import { money, statuses } from "@/lib/shared";
export default async function Dashboard() {
  await adminPage();
  const { orders, pending, revenue, products, lowStock, customers } =
    await adminOverview();
  return (
    <>
      <div className="admin-title">
        <div>
          <p className="eyebrow">VISTA GENERAL</p>
          <h1>Todo en su lugar.</h1>
          <p>Pedidos, catálogo y las próximas tareas de tu tienda.</p>
        </div>
        <Link
          prefetch={false}
          href="/admin/productos?edit=new"
          className="button"
        >
          + Añadir mueble
        </Link>
      </div>
      <div className="stats-grid">
        <Link
          prefetch={false}
          href="/admin/pedidos?estado=PENDING"
          className="stat"
        >
          <span>Pedidos pendientes</span>
          <strong>{pending}</strong>
          <small>Revisar y confirmar →</small>
        </Link>
        <div className="stat">
          <span>Ingresos registrados</span>
          <strong>{money(revenue)}</strong>
          <small>Pedidos marcados como pagados, sin cancelados</small>
        </div>
        <Link prefetch={false} href="/admin/productos" className="stat">
          <span>Muebles en catálogo</span>
          <strong>{products}</strong>
          <small>Gestionar colección →</small>
        </Link>
        <Link prefetch={false} href="/admin/clientes" className="stat">
          <span>Clientes</span>
          <strong>{customers}</strong>
          <small>Cuentas registradas →</small>
        </Link>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Pedidos recientes</h2>
            <Link
              prefetch={false}
              href="/admin/pedidos"
              className="text-link small"
            >
              Ver todos →
            </Link>
          </div>
          {orders.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link
                          prefetch={false}
                          href={`/admin/pedidos?edit=${o.id}`}
                        >
                          JO-{String(o.number).padStart(5, "0")}
                        </Link>
                      </td>
                      <td>{o.customerName}</td>
                      <td>
                        <span className={`status ${o.status.toLowerCase()}`}>
                          {statuses[o.status]}
                        </span>
                      </td>
                      <td>{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Los nuevos pedidos aparecerán aquí.</p>
          )}
        </section>
        <section className="panel">
          <h2>Atención al inventario</h2>
          {lowStock.length ? (
            lowStock.map((p) => (
              <Link
                prefetch={false}
                href={`/admin/productos?edit=${p.id}`}
                className="stock-alert"
                key={p.id}
              >
                <span>{p.name}</span>
                <b>{p.stock} ud.</b>
              </Link>
            ))
          ) : (
            <p className="muted">No hay muebles con stock bajo.</p>
          )}
          <hr />
          <h3>Prepara tu tienda</h3>
          <p className="muted small">
            El catálogo inicial contiene muebles de muestra. Revisa fotos,
            precios, cobertura de envío y contacto antes de anunciar la
            apertura.
          </p>
          <Link
            prefetch={false}
            className="text-link"
            href="/admin/configuracion"
          >
            Completar información →
          </Link>
        </section>
      </div>
      <section className="quick-links">
        <Link prefetch={false} href="/admin/media">
          Subir fotografías ↗
        </Link>
        <Link prefetch={false} href="/admin/paginas">
          Revisar políticas ↗
        </Link>
        <Link prefetch={false} href="/admin/cupones">
          Crear un cupón ↗
        </Link>
      </section>
    </>
  );
}
