import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { productSchema, settingsSchema } from "../src/lib/validation";
import {
  defaultSettings,
  withSettingsDefaults,
  carouselImages,
} from "../src/lib/shared";
const base = {
  name: "Sofá",
  slug: "sofa",
  sku: "SOFA",
  description: "Mueble",
  price: 1,
  salePrice: null,
  categoryId: randomUUID(),
  image: "",
  gallery: [],
  material: "Madera",
  dimensions: "100 × 80",
  finishes: [],
  leadDays: 7,
  stock: 999,
  madeToOrder: true,
  featured: false,
  active: true,
};
const variant = (name: string, price = 10000, stock = 2) => ({
  id: randomUUID(),
  name,
  price,
  stock,
  image: "/images/chair.webp",
  gallery: ["/images/sofa.webp"],
});
describe("independent variants and carousel settings", () => {
  it("derives the minimum price and total inventory from validated variants", () => {
    const p = productSchema.parse({
      ...base,
      variants: [variant("Beige", 10000, 1), variant("Gris", 15000, 3)],
    });
    expect(p.price).toBe(10000);
    expect(p.stock).toBe(4);
    expect(p.image).toBe("/images/chair.webp");
    expect(p.madeToOrder).toBe(false);
    expect(p.salePrice).toBeNull();
  });
  it("rejects duplicate identities, invalid prices, negative stock and missing photos", () => {
    const v = variant("Beige");
    for (const variants of [
      [v, { ...variant("beige") }],
      [v, { ...variant("Gris"), id: v.id }],
      [{ ...v, stock: -1 }],
      [{ ...v, price: 0 }],
      [{ ...v, image: "" }],
    ])
      expect(productSchema.safeParse({ ...base, variants }).success).toBe(
        false,
      );
  });
  it("keeps single-product stock limits and accepts empty variants", () => {
    expect(
      productSchema.safeParse({
        ...base,
        image: "/images/chair.webp",
        stock: 100001,
        variants: [],
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        ...base,
        image: "/images/chair.webp",
        stock: 1,
        variants: [],
      }).success,
    ).toBe(true);
  });
  it("requires a nonempty carousel with at most eight images and preserves legacy cover", () => {
    expect(
      settingsSchema.safeParse({ ...defaultSettings, heroImages: [] }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...defaultSettings,
        heroImages: Array(9).fill("/images/room.webp"),
      }).success,
    ).toBe(false);
    expect(
      carouselImages(
        withSettingsDefaults({ heroImage: "/images/sofa.webp" }),
      )[0],
    ).toBe("/images/sofa.webp");
  });
});
