import { z } from "zod";
const text = (min = 1, max = 200) => z.string().trim().min(min).max(max);
const image = z
  .string()
  .regex(/^\/(images|media)\/[a-zA-Z0-9/_ .-]+\.(webp|png|jpg|jpeg|avif)$/)
  .or(z.literal(""));
export const variantSchema = z.object({
  id: z.uuid(),
  name: text(1, 100),
  price: z.number().int().min(1).max(100000000),
  stock: z.number().int().min(0).max(100000),
  image: image.refine(Boolean, "Selecciona una foto de la variante"),
  gallery: z.array(image.refine(Boolean)).max(9).default([]),
});
const variants = z
  .array(variantSchema)
  .max(20)
  .superRefine((items, context) => {
    const names = new Set<string>();
    const ids = new Set<string>();
    for (const [index, item] of items.entries()) {
      const name = item.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      if (names.has(name) || ids.has(item.id))
        context.addIssue({
          code: "custom",
          message: "Cada variante debe tener un nombre e identificador únicos.",
          path: [index, "name"],
        });
      names.add(name);
      ids.add(item.id);
    }
  });
export const productSchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== "object") return input;
    const p = input as Record<string, unknown>;
    if (!Array.isArray(p.variants) || !p.variants.length) return input;
    return {
      ...p,
      price: Math.min(...p.variants.map((v) => Number(v?.price) || 0)),
      salePrice: null,
      stock: p.variants.reduce((sum, v) => sum + (Number(v?.stock) || 0), 0),
      image: p.variants[0]?.image,
      finishes: [],
      madeToOrder: false,
    };
  },
  z
    .object({
      name: text(),
      slug: text().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      sku: text(),
      description: text(1, 10000),
      price: z.number().int().min(1).max(100000000),
      salePrice: z.number().int().positive().nullable().default(null),
      categoryId: z.uuid(),
      image: image.refine(Boolean, "Selecciona una imagen"),
      gallery: z.array(image).max(10).default([]),
      variants: variants.optional(),
      material: text(),
      dimensions: text(),
      finishes: z.array(text()).max(20).default([]),
      leadDays: z.number().int().min(0).max(365),
      stock: z.number().int().min(0).max(2000000),
      madeToOrder: z.boolean(),
      featured: z.boolean(),
      active: z.boolean(),
    })
    .refine((p) => Boolean(p.variants?.length) || p.stock <= 100000, {
      message: "Máximo 100000 unidades sin variantes.",
      path: ["stock"],
    })
    .refine((p) => p.salePrice === null || p.salePrice < p.price, {
      message: "El precio de oferta debe ser menor al precio normal.",
      path: ["salePrice"],
    }),
);
export const categorySchema = z.object({
  name: text(),
  slug: text().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: text(0, 1000),
  image,
  active: z.boolean(),
  position: z.number().int().min(0).max(1000),
});
export const pageSchema = z.object({
  title: text(),
  slug: text().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: text(0, 30000),
  seoDescription: text(0, 300),
  published: z.boolean(),
});
export const couponSchema = z.object({
  code: text(3, 30)
    .transform((x) => x.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9_-]+$/)),
  percent: z.number().int().min(1).max(80),
  minimum: z.number().int().min(0),
  active: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
});
export const orderSchema = z
  .object({
    idempotencyKey: z.uuid(),
    items: z
      .array(
        z.object({
          productId: z.uuid(),
          variantId: z.uuid().optional(),
          quantity: z.number().int().min(1).max(20),
          finish: text(0, 200),
        }),
      )
      .min(1)
      .max(30),
    name: text(2, 150),
    phone: text(7, 30),
    address: text(0, 500),
    district: text(0, 150),
    delivery: z.enum(["DELIVERY", "PICKUP"]),
    payment: z.enum(["TRANSFER", "YAPE", "CASH"]),
    notes: text(0, 2000),
    coupon: text(0, 30).optional().default(""),
  })
  .refine(
    (o) =>
      o.delivery !== "DELIVERY" ||
      (o.address.length >= 5 && o.district.length >= 2),
    { message: "Completa la dirección y el distrito." },
  );
export const settingsSchema = z.object({
  brand: text(),
  tagline: text(0, 200),
  heroTitle: text(1, 200),
  heroText: text(0, 1000),
  heroImage: image,
  heroImages: z
    .array(image.refine(Boolean, "Selecciona una imagen"))
    .min(1)
    .max(8)
    .optional(),
  announcement: text(0, 200),
  email: z.email().or(z.literal("")),
  phone: text(0, 30),
  whatsapp: z.string().regex(/^\d{7,15}$|^$/),
  address: text(0, 300),
  hours: text(0, 300),
  shippingFee: z.number().int().min(0).max(10000000),
  deliveryArea: text(1, 200),
  pickupAddress: text(0, 500),
  about: text(0, 10000),
  instagram: z
    .url()
    .refine((x) => x.startsWith("https://"))
    .or(z.literal("")),
  footer: text(0, 300),
});
