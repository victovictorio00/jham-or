import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { settings } from "@/lib/catalog";
import { CheckoutForm } from "@/components/forms";
export const metadata = {
  title: "Finalizar pedido",
  robots: { index: false, follow: false },
};
export default async function Checkout() {
  const u = await currentUser();
  if (!u) redirect("/auth/login?next=/checkout");
  const s = await settings();
  return (
    <section className="section">
      <div className="page-intro">
        <p className="eyebrow">EL COMIENZO DE ALGO BONITO</p>
        <h1>Completa tu pedido.</h1>
        <p>Sesión iniciada como {u.email}</p>
      </div>
      <CheckoutForm settings={s} user={u} />
    </section>
  );
}
