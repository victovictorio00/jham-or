"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "./shop";
import type { CardProduct } from "@/lib/shared";
import type { PublicCategory } from "@/lib/published";
type CatalogCard = CardProduct & { createdAt: string };
type Props = { cards: CatalogCard[]; cats: PublicCategory[] };
export function CatalogBrowser(props: Props) {
  const p = useSearchParams();
  return (
    <CatalogView
      {...props}
      category={(p.get("categoria") || "").slice(0, 100)}
      q={(p.get("q") || "").slice(0, 100)}
      sort={p.get("orden") || "featured"}
      page={Math.min(
        1000,
        Math.max(1, Math.floor(Number(p.get("pagina")) || 1)),
      )}
    />
  );
}
export function CatalogView({
  cards,
  cats,
  category = "",
  q = "",
  sort = "featured",
  page = 1,
}: Props & { category?: string; q?: string; sort?: string; page?: number }) {
  const router = useRouter();
  const query = q.toLocaleLowerCase("es-PE");
  let filtered = cards.filter(
    (p) =>
      (!category || p.category.slug === category) &&
      (!query ||
        p.name.toLocaleLowerCase("es-PE").includes(query) ||
        p.material.toLocaleLowerCase("es-PE").includes(query)),
  );
  if (sort === "price-asc")
    filtered = filtered.toSorted(
      (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
    );
  else if (sort === "price-desc")
    filtered = filtered.toSorted(
      (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
    );
  else if (sort === "new")
    filtered = filtered.toSorted((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  const products = filtered.slice((page - 1) * 24, page * 24 + 1);
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
        <form
          className="search-form"
          key={[category, q, sort].join(":")}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            router.push(
              "/productos?" +
                new URLSearchParams({
                  categoria: category,
                  q: String(data.get("q") || ""),
                  orden: String(data.get("orden") || "featured"),
                }),
            );
          }}
        >
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
