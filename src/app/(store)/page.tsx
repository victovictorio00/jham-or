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
  return (
    <>
      <section className="hero">
        <Image
          className="hero-photo"
          src={s.heroImage || "/images/hero.webp"}
          alt="Sala luminosa con muebles en tonos naturales y detalles de madera"
          fill
          sizes="100vw"
          priority
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow light">DISEÑO QUE SE SIENTE</p>
          <h1>
            {s.heroTitle.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h1>
          <p>{s.heroText}</p>
          <Link href="/productos" className="button light-button">
            Descubre la colección <ArrowUpRight size={20} />
          </Link>
          <div className="hero-foot">
            Materiales nobles. Formas esenciales. Tu hogar.
          </div>
        </div>
        <div className="hero-caption">01 — La calidez de lo esencial</div>
      </section>
      <div className="value-strip">
        <span>
          <Leaf size={19} /> Materiales que perduran
        </span>
        <span>
          <Armchair size={19} /> Diseño para la vida real
        </span>
        <span>
          <Truck size={19} /> Entregas coordinadas
        </span>
        <span>
          <HeartHandshake size={19} /> Atención cercana
        </span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CADA RINCÓN, UNA HISTORIA</p>
            <h2>Un hogar, muchas formas de vivir.</h2>
          </div>
          <p>
            Piezas que encuentran su lugar.
            <br />
            Espacios que hablan de ti.
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
              <Image
                src={cat.image || "/images/room.webp"}
                alt={`Muebles de ${cat.name.toLowerCase()}`}
                fill
                sizes="(max-width: 700px) 90vw, 30vw"
              />
              <div>
                <small>0{i + 1} / COLECCIÓN</small>
                <h3>
                  {cat.name}
                  <ArrowUpRight size={26} />
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section collection-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NUESTRA SELECCIÓN</p>
            <h2>Piezas para quedarse.</h2>
          </div>
          <Link href="/productos" className="text-link">
            Ver toda la colección <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="essence">
        <div className="essence-photo">
          <Image
            src="/images/room.webp"
            alt="Un espacio sereno con materiales naturales y muebles de madera"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
        <div className="essence-copy">
          <p className="eyebrow">LA ESENCIA JHAM-OR</p>
          <h2>
            Lo extraordinario
            <br />
            está en lo cotidiano.
          </h2>
          <p>{s.about}</p>
          <Link className="text-link" href="/nosotros">
            Conoce nuestra historia <ArrowRight size={18} />
          </Link>
          <div className="signature">
            Hecho para habitar. Pensado para durar.
          </div>
        </div>
      </section>
      <section className="section invitation">
        <p className="eyebrow">TU PRÓXIMO ESPACIO EMPIEZA AQUÍ</p>
        <h2>Hagamos lugar a lo que importa.</h2>
        <p>Encuentra tu próxima pieza o conversemos sobre lo que imaginas.</p>
        <Link href="/contacto" className="button">
          Conversemos <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
