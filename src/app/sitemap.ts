import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
const entries = unstable_cache(
  async () => {
    const [products, pages] = await Promise.all([
      db.product.findMany({
        where: { active: true, deletedAt: null, category: { active: true } },
        take: 10000,
        select: { slug: true, updatedAt: true },
      }),
      db.page.findMany({
        where: { published: true },
        take: 1000,
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return [
      ...products.map((p) => ({
        url: `https://jhamor.purprum.com/productos/${p.slug}`,
        lastModified: p.updatedAt,
      })),
      ...pages.map((p) => ({
        url: `https://jhamor.purprum.com/paginas/${p.slug}`,
        lastModified: p.updatedAt,
      })),
    ];
  },
  ["sitemap"],
  { tags: ["catalog", "pages"], revalidate: 3600 },
);
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: "https://jhamor.purprum.com" },
    { url: "https://jhamor.purprum.com/productos" },
    { url: "https://jhamor.purprum.com/nosotros" },
    { url: "https://jhamor.purprum.com/contacto" },
    ...(await entries()),
  ];
}
