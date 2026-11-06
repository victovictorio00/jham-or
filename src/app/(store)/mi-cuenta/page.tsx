export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Package,
  Settings,
  ShoppingBag,
  UserRound,
} from "lucide-react";
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
  const user = await currentUser();
  if (!user) redirect("/auth/login?next=/mi-cuenta");
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number((await searchParams).pagina)) || 1),
  );
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
    <section className="account-page">
      <header className="account-welcome">
        <div>
          <p className="eyebrow">MI CUENTA / JHAM-OR</p>
          <h1>
            Hola, <em>{user.name.split(" ")[0]}.</em>
          </h1>
          <p>
            Tu casa tiene nuevas historias por vivir.
            <br />
            Aquí empieza la próxima.
          </p>
        </div>
        <div className="account-avatar" aria-hidden="true">
          {user.name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")}
        </div>
        <div className="account-session-actions">
          {user.role !== "CUSTOMER" && (
            <Link href="/admin" className="text-link" prefetch={false}>
              Administración <ArrowUpRight size={16} />
            </Link>
          )}
          <Logout />
        </div>
      </header>
      <nav className="account-shortcuts" aria-label="Accesos de mi cuenta">
        <a href="#mis-pedidos">
          <Package size={22} />
          <div>
            <strong>Mis pedidos</strong>
            <span>Sigue cada paso de tu compra</span>
          </div>
          <ArrowRight size={18} />
        </a>
        <a href="#mis-datos">
          <UserRound size={22} />
          <div>
            <strong>Mis datos</strong>
            <span>Tu información, siempre al día</span>
          </div>
          <ArrowRight size={18} />
        </a>
        <Link href="/productos">
          <Armchair size={22} />
          <div>
            <strong>Encuentra tu próxima pieza</strong>
            <span>Vuelve a explorar la colección</span>
          </div>
          <ArrowUpRight size={18} />
        </Link>
      </nav>
      <div className="account-content">
        <section id="mis-pedidos" className="account-orders">
          <div className="account-section-title">
            <div>
              <p className="eyebrow">CADA COMPRA, UNA HISTORIA</p>
              <h2>Mis pedidos</h2>
            </div>
            <Package size={28} strokeWidth={1} />
          </div>
          {orders.length ? (
            <div className="account-order-list">
              {orders.slice(0, 20).map((order) => (
                <Link
                  href={`/mi-cuenta/pedidos/${order.id}`}
                  className="account-order"
                  key={order.id}
                  prefetch={false}
                >
                  <div className="order-symbol">
                    <ShoppingBag size={23} strokeWidth={1.2} />
                  </div>
                  <div>
                    <strong>JO-{String(order.number).padStart(5, "0")}</strong>
                    <p>
                      {order.createdAt.toLocaleDateString("es-PE", {
                        timeZone: "America/Lima",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <span className={`status ${order.status.toLowerCase()}`}>
                      {statuses[order.status]}
                    </span>
                  </div>
                  <div className="account-order-total">
                    <strong>{money(order.total)}</strong>
                    <span>
                      Ver detalles <ArrowUpRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="account-empty">
              <div className="account-empty-icon">
                <Armchair size={64} strokeWidth={0.8} />
              </div>
              <p className="eyebrow">TODO UN HOGAR POR DESCUBRIR</p>
              <h3>
                Hagamos espacio
                <br />
                para tu próxima <em>historia.</em>
              </h3>
              <p>
                Cuando elijas tu primera pieza, podrás seguir su pedido desde
                aquí.
              </p>
              <Link href="/productos" className="button">
                Descubre la colección <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
          {(page > 1 || orders.length > 20) && (
            <div className="pagination">
              {page > 1 && (
                <Link
                  href={`?pagina=${page - 1}`}
                  className="button outline"
                  prefetch={false}
                >
                  Anterior
                </Link>
              )}
              <span>Página {page}</span>
              {orders.length > 20 && (
                <Link
                  href={`?pagina=${page + 1}`}
                  className="button outline"
                  prefetch={false}
                >
                  Siguiente
                </Link>
              )}
            </div>
          )}
        </section>
        <section id="mis-datos" className="account-profile">
          <div className="account-section-title">
            <div>
              <p className="eyebrow">A TU MANERA</p>
              <h2>Mis datos</h2>
            </div>
            <Settings size={25} strokeWidth={1} />
          </div>
          <div className="account-email">
            <UserRound size={17} />
            <span>{user.email}</span>
          </div>
          <ProfileForm user={user} />
        </section>
      </div>
    </section>
  );
}
