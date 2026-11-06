import { readFile } from "node:fs/promises";
import {
  withSettingsDefaults,
  defaultSettings,
  type CardProduct,
  type Settings,
} from "./shared";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  position: number;
};
export type PublicProduct = CardProduct & {
  description: string;
  gallery: string[];
  createdAt: string;
  updatedAt: string;
};
export type PublicPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seoDescription: string;
  updatedAt: string;
};
export type PublicSnapshot = {
  version: string;
  revisions: Record<string, string>;
  settings: Settings;
  categories: PublicCategory[];
  products: PublicProduct[];
  pages: PublicPage[];
};
export const publicationFile = () =>
  process.env.PUBLICATION_FILE || `${process.cwd()}/var/publication.json`;
const state = globalThis as unknown as {
  jhamorSnapshot?: Promise<PublicSnapshot>;
};
export function readPublishedSnapshot() {
  if (!state.jhamorSnapshot)
    state.jhamorSnapshot = readFile(publicationFile(), "utf8")
      .then((raw) => {
        const value = JSON.parse(raw) as PublicSnapshot;
        if (
          !value.version ||
          !value.revisions ||
          !Array.isArray(value.products) ||
          !Array.isArray(value.pages) ||
          !Array.isArray(value.categories)
        )
          throw new Error("La publicación pública no es válida.");
        return {
          ...value,
          settings: withSettingsDefaults(value.settings),
        };
      })
      .catch((error) => {
        state.jhamorSnapshot = undefined;
        throw error;
      });
  return state.jhamorSnapshot;
}
export function replacePublishedSnapshot(snapshot: PublicSnapshot) {
  state.jhamorSnapshot = Promise.resolve(snapshot);
}
