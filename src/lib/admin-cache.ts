export type AdminTag =
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "team"
  | "media"
  | "media-options"
  | "pages"
  | "coupons"
  | "audit"
  | "overview";
type Entry = { tags: AdminTag[]; expires: number; promise: Promise<unknown> };
const state = globalThis as unknown as {
  jhamorAdminCache?: Map<string, Entry>;
};
const entries = (): Map<string, Entry> =>
  (state.jhamorAdminCache ??= new Map());
/** Server memory only. Callers must authorize before accessing cached data. */
export async function adminCached<T>(
  key: string,
  tags: AdminTag[],
  load: () => Promise<T>,
): Promise<T> {
  const cache = entries();
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) {
    cache.delete(key);
    cache.set(key, existing);
    return existing.promise as Promise<T>;
  }
  if (existing) cache.delete(key);
  const entry: Entry = {
    tags,
    expires: Date.now() + 300000,
    promise: Promise.resolve().then(load),
  };
  cache.set(key, entry);
  while (cache.size > 200) cache.delete(cache.keys().next().value!);
  try {
    return (await entry.promise) as T;
  } catch (error) {
    if (cache.get(key) === entry) cache.delete(key);
    throw error;
  }
}
export function invalidateAdmin(...tags: AdminTag[]) {
  for (const [key, entry] of entries())
    if (entry.tags.some((tag) => tags.includes(tag))) entries().delete(key);
}
export const adminSectionTag: Record<string, AdminTag> = {
  productos: "products",
  categorias: "categories",
  pedidos: "orders",
  clientes: "customers",
  equipo: "team",
  media: "media",
  paginas: "pages",
  cupones: "coupons",
  historial: "audit",
  configuracion: "media-options",
  overview: "overview",
};
