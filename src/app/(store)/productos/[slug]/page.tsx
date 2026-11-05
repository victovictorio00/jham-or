import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck, ShieldCheck, Package } from "lucide-react";
import { product, settings } from "@/lib/catalog";
import { ProductPurchase } from "@/components/shop";
import { readPublishedSnapshot } from "@/lib/published";
export const revalidate = false;
export const dynamic = "force-static";
export async function generateStaticParams(){return (await readPublishedSnapshot()).products.map(p=>({slug:p.slug}))}
import { money } from "@/lib/shared";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await product((await params).slug);
  return p
    ? {
        title: p.name,
        description: p.description.slice(0, 160),
        openGraph: { images: [p.image] },
      }
    : { title: "Producto no encontrado" };
}
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [p, s] = await Promise.all([product((await params).slug), settings()]);
  if (!p) notFound();
  return (
    <section className="section">
      <div className="breadcrumbs">
        <Link href="/productos">Colección</Link>
        <span>/</span>
        <Link href={`/productos?categoria=${p.category.slug}`}>
          {p.category.name}
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <div className="product-detail">
        <div>
          <div className="detail-image">
            <Image
              src={p.image}
              alt={p.name}
              fill
              priority
              sizes="(max-width: 800px) 95vw, 55vw"
            />
          </div>
          {p.gallery.length > 0 && (
            <div className="gallery">
              {p.gallery.map((src, i) => (
                <a href={src} key={src} target="_blank" rel="noreferrer">
                  <Image
                    src={src}
                    alt={`${p.name}, vista ${i + 2}`}
                    width={250}
                    height={250}
                  />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">JHAM-OR / {p.category.name.toUpperCase()}</p>
          <h1>{p.name}</h1>
          <p className="detail-price">
            {money(p.salePrice ?? p.price)}{" "}
            {p.salePrice && <del>{money(p.price)}</del>}
          </p>
          <p className="pre-line">{p.description}</p>
          <ProductPurchase product={p} />
          <div className="specs">
            <div>
              <span>Material</span>
              <strong>{p.material}</strong>
            </div>
            <div>
              <span>Medidas</span>
              <strong>{p.dimensions}</strong>
            </div>
            <div>
              <span>Referencia</span>
              <strong>{p.sku}</strong>
            </div>
          </div>
          <div className="detail-benefits">
            <p>
              <Truck size={18} /> Entrega coordinada en {s.deliveryArea}
            </p>
            <p>
              <Package size={18} /> Envío desde {money(s.shippingFee)}
            </p>
            <p>
              <ShieldCheck size={18} /> Atención antes y después de tu compra
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
