import { AppError } from "./auth";
import { Prisma } from "@prisma/client";
type Variant = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
};
type Product = {
  id: string;
  price: number;
  salePrice: number | null;
  image: string;
  stock: number;
  madeToOrder: boolean;
  finishes: string[];
  usesVariants: boolean;
  variants: Variant[];
};
export function resolveOffer(
  product: Product,
  item: { variantId?: string; finish?: string },
  checkFinish = true,
) {
  if (product.usesVariants) {
    const variant = product.variants.find(
      (variant) => variant.id === item.variantId,
    );
    if (!variant)
      throw new AppError(
        409,
        "Selecciona una variante disponible de este mueble.",
      );
    return {
      variantId: variant.id,
      finish: variant.name,
      unitPrice: variant.price,
      image: variant.image,
      stock: variant.stock,
      madeToOrder: false,
    };
  }
  if (item.variantId)
    throw new AppError(
      409,
      "Esta variante ya no está disponible. Vuelve a elegir el mueble.",
    );
  const finish = item.finish || "";
  if (
    checkFinish &&
    ((product.finishes.length && !product.finishes.includes(finish)) ||
      (!product.finishes.length && finish))
  )
    throw new AppError(400, "Selecciona un acabado válido.");
  return {
    variantId: undefined,
    finish,
    unitPrice: product.salePrice ?? product.price,
    image: product.image,
    stock: product.stock,
    madeToOrder: product.madeToOrder,
  };
}
export async function syncVariantStock(
  tx: Prisma.TransactionClient,
  ids: string[],
) {
  if (!ids.length) return;
  await tx.$executeRaw`UPDATE "Product" p SET "stock"=(SELECT coalesce(sum(v."stock"),0)::int FROM "ProductVariant" v WHERE v."productId"=p."id" AND v."active"=true), "updatedAt"=CURRENT_TIMESTAMP WHERE p."usesVariants"=true AND p."id" IN (${Prisma.join([...new Set(ids)].map((id) => Prisma.sql`${id}::uuid`))})`;
}
