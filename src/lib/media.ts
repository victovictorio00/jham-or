import { unlink } from "node:fs/promises";
import type { Prisma } from "@prisma/client";
import { transaction } from "./transaction";
import { AppError } from "./auth";
import { readPublishedSnapshot } from "./published";
const referenceLock = 709031;
/** Reference writers may run concurrently; deletion waits for all of them. */
export async function lockMediaReferences(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock_shared(${referenceLock})`;
}
export async function validateMediaReferences(
  tx: Prisma.TransactionClient,
  value: unknown,
) {
  const urls = [
    ...new Set(
      JSON.stringify(value).match(
        /\/media\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|avif)/g,
      ) || [],
    ),
  ];
  if (!urls.length) return;
  const count = await tx.media.count({ where: { url: { in: urls } } });
  if (count !== urls.length)
    throw new AppError(
      409,
      "Una imagen seleccionada ya no está disponible. Actualiza la biblioteca y elige otra.",
    );
}
export async function deleteMedia(id: string, actor: string) {
  const asset = await transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${referenceLock})`;
    const media = await tx.media.findUnique({ where: { id } });
    if (!media) throw new AppError(404, "Imagen no encontrada.");
    const url = media.url;
    const rows = await tx.$queryRaw<{ used: boolean }[]>`SELECT (
   EXISTS(SELECT 1 FROM "Product" WHERE "image"=${url} OR ${url}=ANY("gallery")) OR
   EXISTS(SELECT 1 FROM "Category" WHERE "image"=${url}) OR
   EXISTS(SELECT 1 FROM "Setting" WHERE position(${url} in "value"::text)>0) OR
   EXISTS(SELECT 1 FROM "Order" WHERE position(${url} in "items"::text)>0) OR
   EXISTS(SELECT 1 FROM "Page" WHERE position(${url} in "content")>0)
  ) AS "used"`;
    const published = await readPublishedSnapshot();
    if (rows[0].used || JSON.stringify(published).includes(url))
      throw new AppError(
        409,
        "Esta imagen está en uso en la tienda, en un producto o en un pedido. Reemplázala primero para no dejar imágenes rotas.",
      );
    await tx.media.delete({ where: { id } });
    await tx.audit.create({
      data: {
        actor,
        action: "DELETE",
        entity: "media",
        entityId: id,
        summary: `Imagen eliminada: ${media.name}`,
      },
    });
    return media;
  });
  let fileRemoved = true;
  for (const url of [asset.url, asset.thumbnailUrl].filter(
    (url): url is string => Boolean(url),
  )) {
    const filename = url.replace(/^\/media\//, "");
    if (!/^[a-f0-9-]{36}(?:-thumb)?\.webp$/.test(filename)) continue;
    try {
      await unlink(`${process.env.UPLOAD_DIR || "uploads"}/${filename}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        fileRemoved = false;
        console.error(
          "No se pudo retirar el archivo de una imagen eliminada:",
          filename,
          error,
        );
      }
    }
  }
  return { ok: true, fileRemoved };
}
