import { carouselImages } from "./shared";
import { readPublishedSnapshot } from "./published";
import type { PublicationResource } from "./publication";
export async function publicWarmupManifest(resource?: PublicationResource) {
  const snapshot = await readPublishedSnapshot();
  const catalogPaths = [
    "/",
    "/productos",
    ...snapshot.products.map((p) => `/productos/${p.slug}`),
  ];
  const pagePaths = snapshot.pages.map((p) => `/paginas/${p.slug}`);
  const routes =
    resource === "catalog"
      ? [...catalogPaths, "/sitemap.xml"]
      : resource === "pages"
        ? [...pagePaths, "/sitemap.xml"]
        : [
            "/",
            "/productos",
            "/nosotros",
            "/contacto",
            "/carrito",
            ...catalogPaths,
            ...pagePaths,
            "/sitemap.xml",
          ];
  const sources =
    resource === "pages"
      ? []
      : [
          ...carouselImages(snapshot.settings),
          ...snapshot.categories.map((c) => c.image),
          ...snapshot.products.flatMap((p) => [
            p.image,
            ...(p.variants || []).map((variant) => variant.image),
          ]),
        ];
  const images = [...new Set(sources.filter(Boolean))].flatMap((src) =>
    [
      360,
      640,
      ...(carouselImages(snapshot.settings).includes(src) ? [1440] : []),
    ].map(
      (width) =>
        `/_next/image?${new URLSearchParams({ url: src, w: String(width), q: "75" })}`,
    ),
  );
  return {
    version: snapshot.version,
    revisions: snapshot.revisions,
    routes: [...new Set(routes)],
    images,
  };
}
export async function prewarmPublication(resource?: PublicationResource) {
  const manifest = await publicWarmupManifest(resource);
  const base =
    process.env.INTERNAL_SITE_URL ||
    `http://127.0.0.1:${process.env.PORT || 3012}`;
  const pending = [...manifest.routes, ...manifest.images];
  const failures: string[] = [];
  const isCurrent = async () => {
    const current = await readPublishedSnapshot();
    return resource
      ? current.revisions[resource] === manifest.revisions[resource]
      : current.version === manifest.version;
  };
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      for (;;) {
        if (!(await isCurrent())) return;
        const path = pending.shift();
        if (!path) return;
        try {
          const response = await fetch(base + path, {
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
          });
          await response.arrayBuffer();
          if (!response.ok && (await isCurrent()))
            failures.push(`${path}: ${response.status}`);
        } catch (e) {
          if (!(await isCurrent())) return;
          failures.push(`${path}: ${e instanceof Error ? e.message : "error"}`);
        }
      }
    }),
  );
  const cancelled = !(await isCurrent());
  if (failures.length && !cancelled)
    throw new Error(`No se pudo precargar: ${failures.join(", ")}`);
  return {
    version: manifest.version,
    cancelled,
    pages: manifest.routes.length,
    images: manifest.images.length,
  };
}
