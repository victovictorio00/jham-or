import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { readPublishedSnapshot } from "./published";
export const settings = cache(
  unstable_cache(
    async () => (await readPublishedSnapshot()).settings,
    ["published-settings-v2"],
    { tags: ["settings"], revalidate: false },
  ),
);
export const categories = cache(
  unstable_cache(
    async () => (await readPublishedSnapshot()).categories,
    ["published-categories-v2"],
    { tags: ["catalog"], revalidate: false },
  ),
);
export const catalogCards = cache(
  unstable_cache(
    async () =>
      (await readPublishedSnapshot()).products.map(
        ({ description, gallery, updatedAt, ...card }) => card,
      ),
    ["published-cards-v2"],
    { tags: ["catalog"], revalidate: false },
  ),
);
export const catalog = cache(
  async (category = "", query = "", sort = "featured", page = 1) => {
    const q = query.toLocaleLowerCase("es-PE");
    let products = (await catalogCards()).filter(
      (p) =>
        (!category || p.category.slug === category) &&
        (!q ||
          p.name.toLocaleLowerCase("es-PE").includes(q) ||
          p.material.toLocaleLowerCase("es-PE").includes(q)),
    );
    if (sort === "price-asc")
      products = products.toSorted(
        (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
      );
    else if (sort === "price-desc")
      products = products.toSorted(
        (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
      );
    else if (sort === "new")
      products = products.toSorted((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    return products.slice((page - 1) * 24, page * 24 + 1);
  },
);
export const product = cache(
  unstable_cache(
    async (slug: string) =>
      (await readPublishedSnapshot()).products.find((p) => p.slug === slug) ??
      null,
    ["published-product-v2"],
    { tags: ["catalog"], revalidate: false },
  ),
);
export const publicPage = cache(
  unstable_cache(
    async (slug: string) =>
      (await readPublishedSnapshot()).pages.find((p) => p.slug === slug) ??
      null,
    ["published-page-v2"],
    { tags: ["pages"], revalidate: false },
  ),
);
export function invalidate(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

export const navigationPreviews = cache(
  unstable_cache(
    async () => {
      const snapshot = await readPublishedSnapshot();
      const compact = (product: (typeof snapshot.products)[number]) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        price:
          product.usesVariants && product.variants?.length
            ? Math.min(...product.variants.map((variant) => variant.price))
            : product.price,
        salePrice: product.salePrice,
      });
      return [
        {
          slug: "",
          name: "Colección",
          href: "/productos",
          products: snapshot.products.slice(0, 6).map(compact),
        },
        ...snapshot.categories.map((category) => ({
          slug: category.slug,
          name: category.name,
          href: "/productos?categoria=" + encodeURIComponent(category.slug),
          products: snapshot.products
            .filter((product) => product.category.slug === category.slug)
            .slice(0, 6)
            .map(compact),
        })),
      ];
    },
    ["navigation-previews-v1"],
    { tags: ["catalog"], revalidate: false },
  ),
);
