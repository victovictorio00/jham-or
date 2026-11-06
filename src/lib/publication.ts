import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { defaultSettings, withSettingsDefaults, type Settings } from "./shared";
import {
  publicationFile,
  readPublishedSnapshot,
  replacePublishedSnapshot,
  type PublicSnapshot,
} from "./published";
export type PublicationResource = "catalog" | "settings" | "pages";
const resources: PublicationResource[] = ["catalog", "settings", "pages"];
const state = globalThis as unknown as {
  jhamorPublicationQueue?: Promise<void>;
  jhamorPublicationFailed?: Set<PublicationResource>;
};
const failed = () => (state.jhamorPublicationFailed ??= new Set());
export function markPublication(
  tx: Prisma.TransactionClient,
  resource: PublicationResource,
) {
  const revision = randomUUID();
  return tx.publicationState.upsert({
    where: { key: resource },
    create: { key: resource, revision },
    update: { revision },
  });
}

/** Read public fields in one consistent transaction, only at publication time. */
export async function exportPublication(
  changed: PublicationResource[] = resources,
  previous?: PublicSnapshot,
): Promise<PublicSnapshot> {
  return db.$transaction(
    async (tx) => {
      const revisions = Object.fromEntries(
        (await tx.publicationState.findMany()).map((r) => [r.key, r.revision]),
      );
      const snapshot: PublicSnapshot = previous
        ? {
            ...previous,
            revisions: { ...previous.revisions },
            version: randomUUID(),
          }
        : {
            version: randomUUID(),
            revisions: {},
            settings: defaultSettings,
            categories: [],
            products: [],
            pages: [],
          };
      if (changed.includes("settings")) {
        const row = await tx.setting.findUnique({ where: { key: "store" } });
        snapshot.settings = withSettingsDefaults(
          (row?.value as Partial<Settings>) ?? {},
        );
      }
      if (changed.includes("catalog")) {
        const [categories, products] = await Promise.all([
          tx.category.findMany({
            where: { active: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              image: true,
              position: true,
            },
          }),
          tx.product.findMany({
            where: {
              active: true,
              deletedAt: null,
              category: { active: true },
            },
            orderBy: [
              { featured: "desc" },
              { createdAt: "desc" },
              { id: "asc" },
            ],
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
              price: true,
              salePrice: true,
              image: true,
              description: true,
              gallery: true,
              usesVariants: true,
              variants: {
                where: { active: true },
                orderBy: { position: "asc" },
                select: {
                  id: true,
                  name: true,
                  price: true,
                  stock: true,
                  image: true,
                  gallery: true,
                },
              },
              material: true,
              dimensions: true,
              finishes: true,
              stock: true,
              madeToOrder: true,
              featured: true,
              leadDays: true,
              createdAt: true,
              updatedAt: true,
              category: { select: { name: true, slug: true } },
            },
          }),
        ]);
        snapshot.categories = categories;
        snapshot.products = products.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
      }
      if (changed.includes("pages"))
        snapshot.pages = (
          await tx.page.findMany({
            where: { published: true },
            orderBy: { slug: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              content: true,
              seoDescription: true,
              updatedAt: true,
            },
          })
        ).map((p) => ({ ...p, updatedAt: p.updatedAt.toISOString() }));
      for (const key of changed) {
        if (revisions[key]) snapshot.revisions[key] = revisions[key];
        else delete snapshot.revisions[key];
      }
      return snapshot;
    },
    { isolationLevel: "RepeatableRead", timeout: 30000 },
  );
}
export async function savePublication(snapshot: PublicSnapshot) {
  const file = publicationFile();
  await mkdir(dirname(file), { recursive: true });
  const temporary = file + "." + randomUUID() + ".tmp";
  await writeFile(temporary, JSON.stringify(snapshot), { mode: 0o644 });
  await rename(temporary, file);
  replacePublishedSnapshot(snapshot);
}
export function publishSnapshot(resource: PublicationResource) {
  const run = (state.jhamorPublicationQueue ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      try {
        const previous = await readPublishedSnapshot();
        const snapshot = await exportPublication([resource], previous);
        await savePublication(snapshot);
        failed().delete(resource);
      } catch (error) {
        failed().add(resource);
        throw error;
      }
    });
  state.jhamorPublicationQueue = run;
  return run;
}
export async function retryFailedPublication(resource: PublicationResource) {
  if (!failed().has(resource)) return false;
  await publishSnapshot(resource);
  return true;
}
/** A tiny revision check recovers any committed publication interrupted by a restart. */
export async function recoverPublication() {
  const previous = await readPublishedSnapshot();
  const revisions = await db.publicationState.findMany();
  const pending = resources.filter(
    (key) =>
      revisions.find((r) => r.key === key)?.revision !==
      previous.revisions[key],
  );
  if (pending.length)
    await savePublication(await exportPublication(pending, previous));
  return {
    version: (await readPublishedSnapshot()).version,
    recovered: pending,
  };
}
