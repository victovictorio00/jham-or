import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidate } from "./catalog";
import {
  publishSnapshot,
  retryFailedPublication,
  type PublicationResource,
} from "./publication";
import { prewarmPublication } from "./prewarm";
function refresh(resource: PublicationResource) {
  invalidate(resource);
  revalidatePath("/sitemap.xml");
  if (resource === "catalog") {
    // Catalog changes also alter the shared header previews on every page.
    revalidatePath("/", "layout");
    revalidatePath("/productos/[slug]", "page");
    revalidatePath("/productos");
  }
  if (resource === "pages") revalidatePath("/paginas/[slug]", "page");
  after(async () => {
    try {
      const result = await prewarmPublication(resource);
      console.info("Publicación precargada", result);
    } catch (error) {
      console.error(
        "Error al precargar la publicación; se reintentará al visitar la página.",
        error,
      );
    }
  });
}
export async function publishAndInvalidate(resource: PublicationResource) {
  await publishSnapshot(resource);
  refresh(resource);
}
export async function retryPendingPublication(resource: PublicationResource) {
  if (await retryFailedPublication(resource)) refresh(resource);
}
