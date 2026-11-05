import Image from "next/image";
import Link from "next/link";
import { settings } from "@/lib/catalog";
export const metadata = { title: "Nuestra esencia" };
export default async function About() {
  const s = await settings();
  return (
    <>
      <section className="section page-intro">
        <p className="eyebrow">NUESTRA ESENCIA</p>
        <h1>
          Una forma más cálida
          <br />
          de habitar.
        </h1>
        <p>Diseño con intención. Espacios con identidad.</p>
      </section>
      <section className="essence">
        <div className="essence-photo">
          <Image
            src="/images/room.webp"
            alt="Diseño de interiores con muebles de materiales naturales"
            fill
            sizes="(max-width:800px) 100vw,50vw"
          />
        </div>
        <div className="essence-copy">
          <h2>Creemos en el hogar.</h2>
          <p className="pre-line">{s.about}</p>
          <Link href="/productos" className="button">
            Explora nuestra colección
          </Link>
        </div>
      </section>
      <section className="section values">
        <article>
          <span>01</span>
          <h2>Diseño esencial</h2>
          <p>
            Formas serenas y proporciones que encuentran su lugar en tu día a
            día.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Materiales con carácter</h2>
          <p>
            Texturas y acabados que aportan calidez a los espacios que más
            disfrutas.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Una relación cercana</h2>
          <p>
            Te acompañamos a elegir y coordinamos contigo cada detalle de tu
            pedido.
          </p>
        </article>
      </section>
    </>
  );
}
