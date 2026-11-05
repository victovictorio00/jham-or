import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/shop";
import { settings } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await settings();
  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Header brand={s.brand} announcement={s.announcement} />
      <main id="contenido">{children}</main>
      <footer className="footer">
        <div className="footer-main">
          <div>
            <Link href="/" className="wordmark">
              {s.brand}
              <small>MUEBLES & DISEÑO</small>
            </Link>
            <p>{s.footer}</p>
          </div>
          <div>
            <h3>Encuentra tu espacio</h3>
            <Link href="/productos">Toda la colección</Link>
            <Link href="/productos?categoria=sala">Sala</Link>
            <Link href="/productos?categoria=comedor">Comedor</Link>
            <Link href="/productos?categoria=dormitorio">Dormitorio</Link>
          </div>
          <div>
            <h3>Estamos para ti</h3>
            <Link href="/nosotros">Nuestra esencia</Link>
            <Link href="/contacto">Contacto</Link>
            <Link href="/mi-cuenta">Mi cuenta y pedidos</Link>
            <Link href="/paginas/envios">Envíos y devoluciones</Link>
          </div>
          <div>
            <h3>Conversemos</h3>
            <p>{s.hours}</p>
            {s.email && (
              <a href={`mailto:${s.email}`}>
                {s.email}
                <ArrowUpRight size={14} />
              </a>
            )}
            {s.phone && <a href={`tel:${s.phone}`}>{s.phone}</a>}
            {s.whatsapp && (
              <a
                href={`https://wa.me/${s.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp <ArrowUpRight size={14} />
              </a>
            )}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noreferrer">
                Instagram <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.brand}. Todos los derechos
            reservados.
          </span>
          <div>
            <Link href="/paginas/privacidad">Privacidad</Link>
            <Link href="/paginas/terminos">Términos</Link>
            <span>Precios en soles · PEN</span>
          </div>
        </div>
      </footer>
    </>
  );
}
