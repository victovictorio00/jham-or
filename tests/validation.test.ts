import { describe, it, expect } from "vitest";
import {
  orderSchema,
  productSchema,
  settingsSchema,
} from "../src/lib/validation";
import { safeNext, defaultSettings, transitions } from "../src/lib/shared";
import { randomUUID } from "node:crypto";
const valid = {
  idempotencyKey: randomUUID(),
  items: [{ productId: randomUUID(), quantity: 1, finish: "" }],
  name: "Cliente",
  phone: "999111222",
  address: "Avenida 123",
  district: "Lima",
  delivery: "DELIVERY",
  payment: "TRANSFER",
  notes: "",
};
describe("purchase input boundaries", () => {
  it("requires products and a complete delivery address", () => {
    expect(orderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(orderSchema.safeParse({ ...valid, address: "" }).success).toBe(
      false,
    );
    expect(
      orderSchema.safeParse({
        ...valid,
        delivery: "PICKUP",
        address: "",
        district: "",
      }).success,
    ).toBe(true);
  });
  it("rejects fractional, negative and excessive quantities", () => {
    for (const quantity of [-1, 0, 1.5, 21])
      expect(
        orderSchema.safeParse({
          ...valid,
          items: [{ ...valid.items[0], quantity }],
        }).success,
      ).toBe(false);
  });
  it("does not accept client prices as authoritative fields", () => {
    const parsed = orderSchema.parse({
      ...valid,
      total: 1,
      items: [{ ...valid.items[0], unitPrice: 1 }],
    });
    expect(parsed).not.toHaveProperty("total");
    expect(parsed.items[0]).not.toHaveProperty("unitPrice");
  });
  it("rejects external redirects and backslash redirect tricks", () => {
    for (const url of [
      "//evil.example",
      "https://evil.example",
      "/\\evil.example",
    ])
      expect(safeNext(url)).toBe("/mi-cuenta");
    expect(safeNext("/checkout")).toBe("/checkout");
  });
  it("prevents insecure images and negative shipping fees", () => {
    expect(
      settingsSchema.safeParse({
        ...defaultSettings,
        heroImage: "https://bad.example/x.jpg",
      }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({ ...defaultSettings, shippingFee: -1 }).success,
    ).toBe(false);
  });
  it("cancelled and delivered orders cannot be reopened", () => {
    expect(transitions.CANCELLED).toEqual([]);
    expect(transitions.DELIVERED).toEqual([]);
  });
  it("rejects a sale price higher than the original price", () => {
    expect(
      productSchema.safeParse({
        name: "Mesa",
        slug: "mesa",
        sku: "mesa-1",
        description: "Mesa de roble",
        price: 100,
        salePrice: 200,
        categoryId: randomUUID(),
        image: "/images/sofa.webp",
        material: "Roble",
        dimensions: "100 x 100",
        finishes: [],
        leadDays: 7,
        stock: 1,
        madeToOrder: false,
        featured: false,
        active: true,
      }).success,
    ).toBe(false);
  });
});
