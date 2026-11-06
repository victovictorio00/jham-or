import { resolveOffer, syncVariantStock } from "./offers";
import { invalidateAdmin } from "./admin-cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError } from "./auth";
import { orderSchema } from "./validation";
import { defaultSettings, transitions } from "./shared";
import { markPublication } from "./publication";
import { lockMediaReferences, validateMediaReferences } from "./media";
import { transaction } from "./transaction";
export { transaction } from "./transaction";
import {
  publishAndInvalidate,
  retryPendingPublication,
} from "./publish-runtime";
export type OrderLine = {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  image: string;
  quantity: number;
  finish: string;
  unitPrice: number;
  madeToOrder: boolean;
  leadDays: number;
};
export async function placeOrder(
  user: { id: string; email: string },
  input: unknown,
) {
  const data = orderSchema.parse(input);
  let changed = false;
  let stockChanged = false;
  const order = await transaction(async (tx) => {
    changed = false;
    stockChanged = false;
    const existing = await tx.order.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== user.id)
        throw new AppError(409, "Identificador de pedido no válido.");
      return existing;
    }
    await lockMediaReferences(tx);
    const uniqueIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: {
        id: { in: uniqueIds },
        active: true,
        deletedAt: null,
        category: { active: true },
      },
      include: { variants: { where: { active: true } } },
    });
    const lines: OrderLine[] = [];
    const quantities = new Map<
      string,
      {
        productId: string;
        variantId?: string;
        quantity: number;
        madeToOrder: boolean;
        name: string;
      }
    >();
    const perProduct = new Map<string, number>();
    for (const item of data.items) {
      const product = products.find((product) => product.id === item.productId);
      if (!product)
        throw new AppError(409, "Uno de los muebles ya no está disponible.");
      const offer = resolveOffer(product, item);
      const total = (perProduct.get(product.id) || 0) + item.quantity;
      if (total > 20) throw new AppError(400, "Máximo 20 unidades por mueble.");
      perProduct.set(product.id, total);
      const key = product.id + ":" + (offer.variantId || "base");
      const previous = quantities.get(key);
      quantities.set(key, {
        productId: product.id,
        variantId: offer.variantId,
        quantity: (previous?.quantity || 0) + item.quantity,
        madeToOrder: offer.madeToOrder,
        name: product.name + (offer.variantId ? " · " + offer.finish : ""),
      });
      lines.push({
        productId: product.id,
        ...(offer.variantId ? { variantId: offer.variantId } : {}),
        name: product.name,
        sku: product.sku,
        image: offer.image,
        quantity: item.quantity,
        finish: offer.finish,
        unitPrice: offer.unitPrice,
        madeToOrder: offer.madeToOrder,
        leadDays: product.leadDays,
      });
    }
    await validateMediaReferences(
      tx,
      lines.map((line) => line.image),
    );
    const variantParents: string[] = [];
    for (const [, line] of [...quantities].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (line.madeToOrder) continue;
      const updated = line.variantId
        ? await tx.productVariant.updateMany({
            where: {
              id: line.variantId,
              productId: line.productId,
              active: true,
              stock: { gte: line.quantity },
            },
            data: { stock: { decrement: line.quantity } },
          })
        : await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
      if (updated.count !== 1)
        throw new AppError(
          409,
          `No quedan suficientes unidades de ${line.name}.`,
        );
      if (line.variantId) variantParents.push(line.productId);
      stockChanged = true;
    }
    await syncVariantStock(tx, variantParents);
    const s = await tx.setting.findUnique({ where: { key: "store" } });
    const config = { ...defaultSettings, ...((s?.value as object) ?? {}) };
    if (data.delivery === "PICKUP" && !config.pickupAddress)
      throw new AppError(400, "El recojo aún no está habilitado.");
    const subtotal = lines.reduce((t, i) => t + i.unitPrice * i.quantity, 0);
    const shipping = data.delivery === "DELIVERY" ? config.shippingFee : 0;
    let discount = 0;
    let code: null | string = null;
    if (data.coupon) {
      const coupon = await tx.coupon.findUnique({
        where: { code: data.coupon.toUpperCase() },
      });
      if (
        !coupon ||
        !coupon.active ||
        (coupon.expiresAt && coupon.expiresAt < new Date()) ||
        subtotal < coupon.minimum
      )
        throw new AppError(
          400,
          "El cupón no es válido, ha vencido o no alcanza el importe mínimo.",
        );
      discount = Math.floor((subtotal * coupon.percent) / 100);
      code = coupon.code;
    }
    changed = true;
    const created = await tx.order.create({
      data: {
        userId: user.id,
        idempotencyKey: data.idempotencyKey,
        customerName: data.name,
        email: user.email,
        phone: data.phone,
        address:
          data.delivery === "DELIVERY" ? data.address : config.pickupAddress,
        district: data.delivery === "DELIVERY" ? data.district : "Recojo",
        delivery: data.delivery,
        payment: data.payment,
        subtotal,
        shipping,
        discount,
        total: subtotal + shipping - discount,
        coupon: code,
        notes: data.notes,
        items: lines,
        history: [
          {
            status: "PENDING",
            at: new Date().toISOString(),
            actor: user.email,
            note: "Pedido recibido",
          },
        ],
      },
    });
    if (stockChanged) await markPublication(tx, "catalog");
    return created;
  });
  if (changed) invalidateAdmin("orders", "customers", "overview", "audit");
  if (stockChanged) invalidateAdmin("products");
  if (stockChanged) await publishAndInvalidate("catalog");
  else await retryPendingPublication("catalog");
  return order;
}
export async function changeOrder(id: string, actor: string, input: unknown) {
  const data = z
    .object({
      status: z.enum([
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ]),
      paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED"]),
      note: z.string().trim().max(2000).default(""),
    })
    .parse(input);
  let changed = false;
  let stockChanged = false;
  const result = await transaction(async (tx) => {
    changed = false;
    stockChanged = false;
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new AppError(404, "Pedido no encontrado.");
    if (
      data.status !== order.status &&
      !transitions[order.status]?.includes(data.status)
    )
      throw new AppError(
        409,
        "El pedido cambió o la transición no está permitida.",
      );
    if (
      data.status === order.status &&
      data.paymentStatus === order.paymentStatus &&
      !data.note
    )
      return order;
    if (data.status === "CANCELLED" && order.status !== "CANCELLED") {
      const lines = order.items as unknown as OrderLine[];
      for (const line of [...lines].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      )) {
        if (!line.madeToOrder) {
          if (line.variantId)
            await tx.productVariant.updateMany({
              where: { id: line.variantId, productId: line.productId },
              data: { stock: { increment: line.quantity } },
            });
          else
            await tx.product.updateMany({
              where: { id: line.productId },
              data: { stock: { increment: line.quantity } },
            });
          stockChanged = true;
        }
      }
      await syncVariantStock(
        tx,
        lines
          .filter((line) => line.variantId && !line.madeToOrder)
          .map((line) => line.productId),
      );
    }
    changed = true;
    const updated = await tx.order.update({
      where: { id },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
        history: [
          ...(order.history as Prisma.JsonArray),
          {
            status: data.status,
            paymentStatus: data.paymentStatus,
            at: new Date().toISOString(),
            actor,
            note: data.note,
          },
        ],
      },
    });
    await tx.audit.create({
      data: {
        actor,
        action: "UPDATE",
        entity: "orders",
        entityId: id,
        summary: `Pedido JO-${order.number}: ${data.status} / ${data.paymentStatus}`,
      },
    });
    if (stockChanged) await markPublication(tx, "catalog");
    return updated;
  });
  if (changed) invalidateAdmin("orders", "customers", "overview", "audit");
  if (stockChanged) invalidateAdmin("products");
  if (stockChanged) await publishAndInvalidate("catalog");
  else await retryPendingPublication("catalog");
  return result;
}
