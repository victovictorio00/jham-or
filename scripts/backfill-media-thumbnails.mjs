import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
let cursor,
  created = 0,
  failed = 0;
try {
  for (;;) {
    const rows = await db.media.findMany({
      where: { thumbnailUrl: null, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: "asc" },
      take: 50,
    });
    if (!rows.length) break;
    for (const media of rows) {
      cursor = media.id;
      const filename = media.url.replace(/^\/media\//, "");
      if (!/^[a-f0-9-]{36}\.webp$/.test(filename)) {
        failed++;
        continue;
      }
      try {
        const original = await readFile(
          `${process.env.UPLOAD_DIR || "uploads"}/${filename}`,
        );
        const thumbnailName = filename.replace(".webp", "-thumb.webp");
        const thumbnail = await sharp(original)
          .resize(360, 360, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 75 })
          .toBuffer();
        await writeFile(
          `${process.env.UPLOAD_DIR || "uploads"}/${thumbnailName}`,
          thumbnail,
        );
        await db.media.update({
          where: { id: media.id },
          data: { thumbnailUrl: "/media/" + thumbnailName },
        });
        created++;
      } catch (error) {
        failed++;
        console.error("No se pudo generar la miniatura de", media.id, error);
      }
    }
  }
  console.log(
    `Miniaturas generadas: ${created}. Archivos no procesados: ${failed}.`,
  );
  if (failed) process.exitCode = 1;
} finally {
  await db.$disconnect();
}
