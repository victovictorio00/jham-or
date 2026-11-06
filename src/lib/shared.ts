export const money = (cents: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    cents / 100,
  );
export const statuses: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PREPARING: "En fabricación",
  READY: "Listo para entregar",
  SHIPPED: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};
export const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "READY", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export const defaultSettings = {
  brand: "JHAM-OR",
  tagline: "Muebles con alma. Espacios para vivir.",
  heroTitle: "El arte de sentirte\nen casa.",
  heroText:
    "Diseño que perdura, materiales que inspiran. Descubre muebles pensados para acompañar tu forma de vivir.",
  heroImage: "/images/hero.webp",
  heroImages: ["/images/hero.webp", "/images/dining.webp", "/images/room.webp"],
  announcement: "Diseño atemporal · Hecho para tu hogar",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  hours: "Atención de lunes a sábado",
  shippingFee: 8000,
  deliveryArea: "Lima Metropolitana",
  pickupAddress: "",
  about:
    "Creemos en los espacios que se sienten propios. En la calidez de la madera, en las formas sencillas y en los detalles que hacen de una casa un hogar.",
  instagram: "",
  footer: "Diseño que habita contigo.",
};
export type Settings = typeof defaultSettings;
export type ProductVariant = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  gallery: string[];
};
export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  image: string;
  material: string;
  dimensions: string;
  finishes: string[];
  stock: number;
  madeToOrder: boolean;
  featured: boolean;
  leadDays: number;
  category: { name: string; slug: string };
  description?: string;
  gallery?: string[];
  usesVariants?: boolean;
  variants?: ProductVariant[];
};
export type CartItem = {
  product: CardProduct;
  quantity: number;
  finish: string;
  variantId?: string;
};
export function safeNext(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/mi-cuenta";
}

export type NavigationProduct = Pick<
  CardProduct,
  "id" | "name" | "slug" | "image" | "price" | "salePrice"
>;
export type NavigationGroup = {
  slug: string;
  name: string;
  href: string;
  products: NavigationProduct[];
};
export function carouselImages(settings: Settings) {
  return [
    ...new Set(
      (settings.heroImages?.length
        ? settings.heroImages
        : [settings.heroImage || "/images/hero.webp"]
      ).filter(Boolean),
    ),
  ].slice(0, 8);
}

export function withSettingsDefaults(value: Partial<Settings>): Settings {
  const settings = { ...defaultSettings, ...value };
  if (!Array.isArray(value.heroImages))
    settings.heroImages = [
      ...new Set(
        [settings.heroImage, ...defaultSettings.heroImages.slice(1)].filter(
          Boolean,
        ),
      ),
    ];
  return settings;
}

export function lowestPrice(product: CardProduct) {
  return product.usesVariants && product.variants?.length
    ? Math.min(...product.variants.map((variant) => variant.price))
    : (product.salePrice ?? product.price);
}
