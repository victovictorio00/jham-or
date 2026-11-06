import { Suspense } from "react";
import {
  ProductDetails,
  ProductDetailsBrowser,
} from "@/components/product-details";
import Link from "next/link";
import { notFound } from "next/navigation";
import { product, settings } from "@/lib/catalog";
import { readPublishedSnapshot } from "@/lib/published";
export const revalidate = false;
export const dynamic = "force-static";
export async function generateStaticParams() {
  return (await readPublishedSnapshot()).products.map((p) => ({
    slug: p.slug,
  }));
}
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
      <Suspense
        fallback={
          <ProductDetails
            product={p}
            deliveryArea={s.deliveryArea}
            shippingFee={s.shippingFee}
          />
        }
      >
        <ProductDetailsBrowser
          product={p}
          deliveryArea={s.deliveryArea}
          shippingFee={s.shippingFee}
        />
      </Suspense>
    </section>
  );
}
