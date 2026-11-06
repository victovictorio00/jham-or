import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Leaf,
  Armchair,
  Truck,
  HeartHandshake,
} from "lucide-react";
import { catalog, categories, settings } from "@/lib/catalog";
import { ProductCard } from "@/components/shop";
export default async function Home() {
  const [s, products, cats] = await Promise.all([
    settings(),
    catalog(),
    categories(),
  ]);
  const selection = products.toSorted(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
  return (
    <>
      <section className="hero" aria-label="La colección Jham-or">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="editorial-rule" />
            EL ARTE DE HABITAR
          </p>
          <h1>
            {s.heroTitle.split("\n").map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </h1>
          <p>{s.heroText}</p>
          <Link href="/productos" className="button">
            Descubre la colección <ArrowUpRight size={18} />
          </Link>
          <div className="hero-foot">
            <span className="hero-seal" aria-hidden="true">
              J.
            </span>
            <span>
              Muebles con carácter.
              <br />
              <strong>Espacios que se sienten propios.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <Image
            className="hero-photo"
            src={s.heroImage || "/images/hero.webp"}
            alt="Sala luminosa con muebles en tonos naturales y detalles de madera"
            fill
            sizes="(max-width:850px) 100vw, 58vw"
            priority
          />
          <div className="hero-image-note">
            <span>LA BELLEZA DE LO COTIDIANO</span>
            <span>
              Diseño para vivirlo <ArrowUpRight size={17} />
            </span>
          </div>
        </div>
        <div className="hero-edition" aria-hidden="true">
          JHAM-OR / OBJETOS PARA EL HOGAR
        </div>
      </section>
      <div className="value-strip">
        <span>
          <Leaf size={18} />
          Materiales que perduran
        </span>
        <span>
          <Armchair size={18} />
          Diseño para la vida real
        </span>
        <span>
          <Truck size={18} />
          Entregas coordinadas
        </span>
        <span>
          <HeartHandshake size={18} />
          Atención cercana
        </span>
      </div>
      <section className="section spaces-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / UNIVERSOS JHAM-OR</p>
            <h2>
              Una nueva mirada
              <br />a tu <em>espacio.</em>
            </h2>
          </div>
          <p>
            Encuentra el equilibrio entre lo que amas
            <br />y la forma en que vives.
          </p>
        </div>
        <div className="category-grid">
          {cats.slice(0, 3).map((cat, i) => (
            <Link
              href={`/productos?categoria=${cat.slug}`}
              className="category-card"
              key={cat.id}
              prefetch={false}
            >
              <div className="category-photo">
                <Image
                  src={cat.image || "/images/room.webp"}
                  alt={`Muebles de ${cat.name.toLowerCase()}`}
                  fill
                  sizes="(max-width:600px) 88vw, (max-width:850px) 45vw, 30vw"
                />
                <span className="category-index">0{i + 1}</span>
              </div>
              <div className="category-title">
                <small>EL PLACER DE ESTAR</small>
                <h3>
                  {cat.name}
                  <ArrowUpRight size={24} />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / PIEZAS SELECCIONADAS</p>
            <h2>
              El detalle hace
              <br />
              la <em>diferencia.</em>
            </h2>
          </div>
          <Link href="/productos" className="text-link">
            Ver toda la colección <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {selection.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="essence home-essence">
        <div className="essence-photo">
          <Image
            src="/images/room.webp"
            alt="Un espacio sereno con materiales naturales y muebles de madera"
            fill
            sizes="(max-width:850px) 100vw, 50vw"
          />
          <span className="photo-credit">TEXTURAS, LUZ Y EQUILIBRIO</span>
        </div>
        <div className="essence-copy">
          <p className="eyebrow">03 / NUESTRA ESENCIA</p>
          <span className="essence-monogram" aria-hidden="true">
            J.
          </span>
          <h2>
            Lo extraordinario
            <br />
            está en lo <em>cotidiano.</em>
          </h2>
          <p>{s.about}</p>
          <Link className="text-link" href="/nosotros">
            La filosofía Jham-or <ArrowRight size={18} />
          </Link>
          <div className="signature">
            Hecho para habitar. Pensado para durar.
          </div>
        </div>
      </section>
      <section
        className="section design-notes"
        aria-label="Nuestra forma de entender el diseño"
      >
        <div>
          <p className="eyebrow">DISEÑO CON INTENCIÓN</p>
          <h2>
            La elegancia
            <br />
            que se <em>siente.</em>
          </h2>
          <Link href="/productos" className="text-link">
            Encuentra tu pieza <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="design-note-list">
          {[
            [
              "01",
              "Formas en equilibrio",
              "Líneas serenas y proporciones que conviven con tu forma de habitar.",
            ],
            [
              "02",
              "Texturas con carácter",
              "La calidez de la madera, los tejidos y los detalles que dan vida a cada ambiente.",
            ],
            [
              "03",
              "Una elección personal",
              "Te acompañamos a elegir medidas y acabados para encontrar tu lugar.",
            ],
          ].map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="invitation">
        <div>
          <p className="eyebrow">HAGAMOS ESPACIO PARA LO QUE IMPORTA</p>
          <h2>
            Tu próximo capítulo,
            <br />
            <em>en casa.</em>
          </h2>
          <p>Conversemos sobre ese espacio que imaginas.</p>
          <Link href="/contacto" className="button light-button">
            Conversemos <ArrowUpRight size={18} />
          </Link>
        </div>
        <span className="invitation-mark" aria-hidden="true">
          J.
        </span>
      </section>
    </>
  );
}
