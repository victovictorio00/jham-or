import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, statuses } from "@/lib/shared";
import { Logout, ProfileForm } from "@/components/forms";
export const metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};
export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/auth/login?next=/mi-cuenta");
  const page = Math.max(
    1,
    Math.min(1000, Number((await searchParams).pagina) || 1),
  );
  const orders = await db.order.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 21,
    skip: (page - 1) * 20,
    select: {
      id: true,
      number: true,
      createdAt: true,
      status: true,
      total: true,
    },
  });
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TU ESPACIO PERSONAL</p>
          <h1>Hola, {u.name.split(" ")[0]}.</h1>
        </div>
        <div className="actions">
          {u.role !== "CUSTOMER" && (
            <Link href="/admin" className="button outline">
              Administración
            </Link>
          )}
          <Logout />
        </div>
      </div>
      <div className="account-layout">
        <div>
          <h2>Mis pedidos</h2>
          {orders.length ? (
            orders.slice(0, 20).map((o) => (
              <Link
                href={`/mi-cuenta/pedidos/${o.id}`}
                className="order-card"
                key={o.id}
              >
                <div>
                  <strong>JO-{String(o.number).padStart(5, "0")}</strong>
                  <p className="muted small">
                    {o.createdAt.toLocaleDateString("es-PE", {
                      timeZone: "America/Lima",
                    })}
                  </p>
                </div>
                <span className={`status ${o.status.toLowerCase()}`}>
                  {statuses[o.status]}
                </span>
                <strong>{money(o.total)}</strong>
              </Link>
            ))
          ) : (
            <div className="empty">
              <h3>Tu primera historia está por comenzar.</h3>
              <Link href="/productos" className="text-link">
                Descubre la colección →
              </Link>
            </div>
          )}
          <div className="pagination">
            {page > 1 && <Link href={`?pagina=${page - 1}`}>Anterior</Link>}
            {orders.length > 20 && (
              <Link href={`?pagina=${page + 1}`}>Siguiente</Link>
            )}
          </div>
        </div>
        <aside className="summary">
          <h2>Mis datos</h2>
          <p className="muted small">{u.email}</p>
          <ProfileForm user={u} />
        </aside>
      </div>
    </section>
  );
}
