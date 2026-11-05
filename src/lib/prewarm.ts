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
          snapshot.settings.heroImage,
          ...snapshot.categories.map((c) => c.image),
          ...snapshot.products.map((p) => p.image),
        ];
  const images = [...new Set(sources.filter(Boolean))].flatMap((src) =>
    [360, 640, ...(src === snapshot.settings.heroImage ? [1440] : [])].map(
      (width) =>
        `/_next/image?${new URLSearchParams({ url: src, w: String(width), q: "75" })}`,
    ),
  );
  return { version: snapshot.version, routes: [...new Set(routes)], images };
}
export async function prewarmPublication(resource?: PublicationResource) {
  const manifest = await publicWarmupManifest(resource);
  const base =
    process.env.INTERNAL_SITE_URL ||
    `http://127.0.0.1:${process.env.PORT || 3012}`;
  const pending = [...manifest.routes, ...manifest.images];
  const failures: string[] = [];
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      for (;;) {
        const path = pending.shift();
        if (!path) return;
        try {
          const response = await fetch(base + path, {
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
          });
          await response.arrayBuffer();
          if (!response.ok) failures.push(`${path}: ${response.status}`);
        } catch (e) {
          failures.push(`${path}: ${e instanceof Error ? e.message : "error"}`);
        }
      }
    }),
  );
  if (failures.length)
    throw new Error(`No se pudo precargar: ${failures.join(", ")}`);
  return {
    version: manifest.version,
    pages: manifest.routes.length,
    images: manifest.images.length,
  };
}
