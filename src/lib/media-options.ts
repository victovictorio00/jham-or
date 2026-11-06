import { db } from "./db";
import { requireAdmin } from "./auth";
import { adminCached } from "./admin-cache";
export async function mediaOptions() {
  await requireAdmin();
  return adminCached("media-options", ["media-options"], async () => {
    const media = await db.media.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 200,
      select: { url: true, name: true, thumbnailUrl: true },
    });
    return [
      ...media,
      ...[
        "hero",
        "sofa",
        "chair",
        "dining",
        "bed",
        "table",
        "shelf",
        "room",
        "armchair",
      ].map((name) => ({
        url: `/images/${name}.webp`,
        name: `Muestra: ${name}`,
        thumbnailUrl: null,
      })),
    ];
  });
}
