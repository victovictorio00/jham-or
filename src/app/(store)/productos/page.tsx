import Link from "next/link";
import { catalog, categories } from "@/lib/catalog";
import { ProductCard } from "@/components/shop";
export const metadata = { title: "La colección" };
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const category = (params.categoria || "").slice(0, 100),
    q = (params.q || "").slice(0, 100),
    sort = params.orden || "featured",
    page = Math.min(1000, Math.max(1, Number(params.pagina) || 1));
  const [products, cats] = await Promise.all([
    catalog(category, q, sort, page),
    categories(),
  ]);
  const href = (p: number) =>
    `/productos?${new URLSearchParams({ categoria: category, q, orden: sort, pagina: String(p) })}`;
  return (
    <section className="section catalog-section">
      <div className="page-intro">
        <p className="eyebrow">FORMAS DE HABITAR</p>
        <h1>
          {cats.find((c) => c.slug === category)?.name || "Nuestra colección"}
        </h1>
        <p>Muebles que combinan carácter, calidez y funcionalidad.</p>
      </div>
      <div className="catalog-bar">
        <div className="category-tabs">
          <Link href="/productos" className={!category ? "selected" : ""}>
            Todos
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/productos?categoria=${c.slug}`}
              className={category === c.slug ? "selected" : ""}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <form className="search-form">
          <input type="hidden" name="categoria" value={category} />
          <input
            name="q"
            aria-label="Buscar muebles"
            placeholder="Buscar una pieza…"
            defaultValue={q}
            maxLength={100}
          />
          <select
            name="orden"
            aria-label="Ordenar colección"
            defaultValue={sort}
          >
            <option value="featured">Destacados</option>
            <option value="new">Más recientes</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
          <button className="button small-button">Buscar</button>
        </form>
      </div>
      {products.length ? (
        <div className="product-grid">
          {products.slice(0, 24).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>No encontramos esa pieza.</h2>
          <p>Prueba con otro nombre o explora toda la colección.</p>
          <Link href="/productos" className="button">
            Ver todos los muebles
          </Link>
        </div>
      )}
      <div className="pagination">
        {page > 1 && (
          <Link className="button outline" href={href(page - 1)}>
            Anterior
          </Link>
        )}
        <span>Página {page}</span>
        {products.length > 24 && (
          <Link className="button outline" href={href(page + 1)}>
            Siguiente
          </Link>
        )}
      </div>
    </section>
  );
}
