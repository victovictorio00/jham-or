import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, statuses } from "@/lib/shared";
import type { OrderLine } from "@/lib/orders";
export const metadata = {
  title: "Detalle de pedido",
  robots: { index: false, follow: false },
};
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await currentUser();
  if (!u) redirect("/auth/login?next=/mi-cuenta");
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) notFound();
  const o = await db.order.findFirst({ where: { id, userId: u.id } });
  if (!o) notFound();
  const lines = o.items as unknown as OrderLine[];
  return (
    <section className="section">
      <Link href="/mi-cuenta" className="text-link">
        ← Mis pedidos
      </Link>
      <div className="page-intro">
        <p className="eyebrow">GRACIAS POR HACERNOS PARTE DE TU HOGAR</p>
        <h1>Pedido JO-{String(o.number).padStart(5, "0")}</h1>
        <span className={`status ${o.status.toLowerCase()}`}>
          {statuses[o.status]}
        </span>
      </div>
      <div className="cart-layout">
        <div>
          {lines.map((line, i) => (
            <article className="cart-line" key={i}>
              <Image
                src={line.image}
                alt={line.name}
                width={110}
                height={110}
              />
              <div>
                <h3>{line.name}</h3>
                <p>
                  {line.finish} · {line.quantity} unidad(es)
                </p>
                <p className="small muted">
                  Plazo estimado al pedir: {line.leadDays} días
                </p>
              </div>
              <strong>{money(line.unitPrice * line.quantity)}</strong>
            </article>
          ))}
          <h2>Seguimiento</h2>
          <ol className="timeline">
            {(o.history as { status: string; at: string; note?: string }[]).map(
              (h, i) => (
                <li key={i}>
                  <strong>{statuses[h.status]}</strong>
                  <small>
                    {new Date(h.at).toLocaleString("es-PE", {
                      timeZone: "America/Lima",
                    })}
                  </small>
                  {h.note && <p>{h.note}</p>}
                </li>
              ),
            )}
          </ol>
        </div>
        <aside className="summary">
          <h2>Resumen</h2>
          <p>
            {o.customerName}
            <br />
            {o.phone}
          </p>
          <p>
            {o.address}
            <br />
            {o.district}
          </p>
          <p>
            {o.delivery === "PICKUP" ? "Recojo en tienda" : "Envío a domicilio"}
          </p>
          <div className="total-row">
            <span>Subtotal</span>
            <span>{money(o.subtotal)}</span>
          </div>
          <div className="total-row">
            <span>Envío</span>
            <span>{money(o.shipping)}</span>
          </div>
          {o.discount > 0 && (
            <div className="total-row">
              <span>Descuento ({o.coupon})</span>
              <span>−{money(o.discount)}</span>
            </div>
          )}
          <div className="total-row grand">
            <span>Total</span>
            <strong>{money(o.total)}</strong>
          </div>
          <p>
            Pago:{" "}
            {o.payment === "TRANSFER"
              ? "Transferencia"
              : o.payment === "YAPE"
                ? "Yape"
                : "Efectivo"}{" "}
            ·{" "}
            {o.paymentStatus === "PAID"
              ? "Pagado"
              : o.paymentStatus === "REFUNDED"
                ? "Reembolsado"
                : "Pendiente"}
          </p>
          <p className="muted small">
            Este resumen no es un comprobante de pago. Coordinaremos contigo la
            entrega y el pago.
          </p>
          {o.notes && <p>Indicaciones: {o.notes}</p>}
        </aside>
      </div>
    </section>
  );
}
