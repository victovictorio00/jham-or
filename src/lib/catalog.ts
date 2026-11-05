import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "./db";
import { defaultSettings, Settings } from "./shared";
export const settings = cache(
  unstable_cache(
    async () =>
      ({
        ...defaultSettings,
        ...(((await db.setting.findUnique({ where: { key: "store" } }))
          ?.value as object) ?? {}),
      }) as Settings,
    ["store-settings"],
    { tags: ["settings"] },
  ),
);
export const categories = cache(
  unstable_cache(
    () =>
      db.category.findMany({
        where: { active: true },
        orderBy: { position: "asc" },
      }),
    ["categories"],
    { tags: ["catalog"] },
  ),
);
const select = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  salePrice: true,
  image: true,
  material: true,
  dimensions: true,
  finishes: true,
  stock: true,
  madeToOrder: true,
  featured: true,
  leadDays: true,
  category: { select: { name: true, slug: true } },
};
export const catalog = cache(
  unstable_cache(
    (
      category: string = "",
      query: string = "",
      sort: string = "featured",
      page: number = 1,
    ) =>
      db.product.findMany({
        where: {
          active: true,
          deletedAt: null,
          category: { active: true, ...(category ? { slug: category } : {}) },
          ...(query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" as const } },
                  {
                    material: { contains: query, mode: "insensitive" as const },
                  },
                ],
              }
            : {}),
        },
        select,
        orderBy:
          sort === "price-asc"
            ? { price: "asc" }
            : sort === "price-desc"
              ? { price: "desc" }
              : sort === "new"
                ? { createdAt: "desc" }
                : [{ featured: "desc" }, { createdAt: "desc" }],
        take: 25,
        skip: (page - 1) * 24,
      }),
    ["catalog-cards"],
    { tags: ["catalog"], revalidate: 300 },
  ),
);
export const product = cache(
  unstable_cache(
    (slug: string) =>
      db.product.findFirst({
        where: {
          slug,
          active: true,
          deletedAt: null,
          category: { active: true },
        },
        select: { ...select, description: true, gallery: true },
      }),
    ["product"],
    { tags: ["catalog"], revalidate: 300 },
  ),
);
export const publicPage = cache(
  unstable_cache(
    (slug: string) => db.page.findFirst({ where: { slug, published: true } }),
    ["pages"],
    { tags: ["pages"] },
  ),
);
export function invalidate(tag: string) {
  revalidateTag(tag, { expire: 0 });
}
