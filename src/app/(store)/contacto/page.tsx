import Link from "next/link";
import { settings } from "@/lib/catalog";
export const metadata = { title: "Conversemos" };
export default async function Contact() {
  const s = await settings();
  return (
    <section className="section contact-page">
      <p className="eyebrow">ESTAMOS CERCA</p>
      <h1>
        Tu hogar comienza
        <br />
        con una conversación.
      </h1>
      <p>
        Consultas sobre medidas, materiales o tu próximo pedido.
        <br />
        Estamos para ayudarte a encontrar tu pieza.
      </p>
      <div className="contact-grid">
        <article>
          <h2>Escríbenos</h2>
          {s.email ? (
            <a className="text-link" href={`mailto:${s.email}`}>
              {s.email}
            </a>
          ) : (
            <p>Los canales de contacto se publicarán próximamente.</p>
          )}
          {s.whatsapp && (
            <a
              className="button"
              href={`https://wa.me/${s.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              Conversar por WhatsApp
            </a>
          )}
          {s.phone && <a href={`tel:${s.phone}`}>{s.phone}</a>}
        </article>
        <article>
          <h2>Encuéntranos</h2>
          <p>{s.address || "Atención online"}</p>
          <p>{s.hours}</p>
          <p>Entregas: {s.deliveryArea}</p>
        </article>
        <article>
          <h2>Tu pedido, a mano</h2>
          <p>
            Consulta el estado y los detalles de tus compras desde tu cuenta.
          </p>
          <Link href="/mi-cuenta" className="text-link">
            Ver mis pedidos →
          </Link>
        </article>
      </div>
    </section>
  );
}
