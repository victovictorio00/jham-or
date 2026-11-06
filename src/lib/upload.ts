import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { db } from "./db";
import { AppError } from "./auth";
import { invalidateAdmin } from "./admin-cache";
// Bound image decoding memory across simultaneous administrators.
const state = globalThis as unknown as {
  imageUploads?: { active: number; waiting: (() => void)[] };
};
async function acquire() {
  const queue = (state.imageUploads ??= { active: 0, waiting: [] });
  if (queue.active >= 2) {
    if (queue.waiting.length >= 20)
      throw new AppError(
        429,
        "Hay varias imágenes en proceso. Vuelve a intentarlo.",
      );
    await new Promise<void>((resolve) => queue.waiting.push(resolve));
  } else queue.active++;
  return () => {
    const next = queue.waiting.shift();
    if (next) next();
    else queue.active--;
  };
}
export async function uploadImage(req: Request) {
  const timing: string[] = [];
  let last = performance.now();
  const mark = (name: string) => {
    const now = performance.now();
    timing.push(`${name};dur=${(now - last).toFixed(1)}`);
    last = now;
  };
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024)
    throw new AppError(400, "Selecciona una imagen de hasta 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  mark("receive");
  const release = await acquire();
  mark("queue");
  try {
    let decoded;
    try {
      decoded = await sharp(bytes, {
        limitInputPixels: 25000000,
        animated: false,
      })
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new AppError(400, "Imagen no válida. Usa JPG, PNG, WebP o AVIF.");
    }
    const raw = {
      width: decoded.info.width,
      height: decoded.info.height,
      channels: decoded.info.channels,
    };
    const [output, thumbnail] = await Promise.all([
      sharp(decoded.data, { raw }).webp({ quality: 82 }).toBuffer(),
      sharp(decoded.data, { raw })
        .resize(360, 360, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer(),
    ]);
    mark("process");
    const name = randomUUID() + ".webp",
      thumb = name.replace(".webp", "-thumb.webp");
    const directory = process.env.UPLOAD_DIR || "uploads";
    const files = [`${directory}/${name}`, `${directory}/${thumb}`];
    try {
      await mkdir(directory, { recursive: true });
      const writes = await Promise.allSettled([
        writeFile(files[0], output),
        writeFile(files[1], thumbnail),
      ]);
      for (const result of writes)
        if (result.status === "rejected") throw result.reason;
      mark("write");
      const media = await db.media.create({
        data: {
          url: "/media/" + name,
          thumbnailUrl: "/media/" + thumb,
          name: file.name.slice(0, 200),
          alt: file.name.slice(0, 200),
          size: output.length,
          width: raw.width,
          height: raw.height,
        },
      });
      mark("database");
      invalidateAdmin("media", "media-options");
      return Response.json(media, {
        status: 201,
        headers: {
          "Cache-Control": "private, no-store",
          "Server-Timing": timing.join(", "),
        },
      });
    } catch (error) {
      await Promise.allSettled(files.map((file) => unlink(file)));
      throw error;
    }
  } finally {
    release();
  }
}
