import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { AppError } from "./auth";
import { orderSchema } from "./validation";
import { defaultSettings, transitions } from "./shared";
import { invalidate } from "./catalog";
export type OrderLine = {
  productId: string;
  name: string;
  sku: string;
  image: string;
  quantity: number;
  finish: string;
  unitPrice: number;
  madeToOrder: boolean;
  leadDays: number;
};
export async function transaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let n = 0; ; n++) {
    try {
      return await db.$transaction(work, {
        isolationLevel: "Serializable",
        timeout: 15000,
      });
    } catch (e) {
      if (
        n < 3 &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034"
      )
        continue;
      throw e;
    }
  }
}
export async function placeOrder(
  user: { id: string; email: string },
  input: unknown,
) {
  const data = orderSchema.parse(input);
  let stockChanged = false;
  const order = await transaction(async (tx) => {
    stockChanged = false;
    const existing = await tx.order.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== user.id)
        throw new AppError(409, "Identificador de pedido no válido.");
      return existing;
    }
    const uniqueIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await tx.product.findMany({
      where: {
        id: { in: uniqueIds },
        active: true,
        deletedAt: null,
        category: { active: true },
      },
    });
    const lines: OrderLine[] = [];
    const quantities = new Map<string, number>();
    for (const item of data.items) {
      const p = products.find((p) => p.id === item.productId);
      if (!p)
        throw new AppError(409, "Uno de los muebles ya no está disponible.");
      if (
        (p.finishes.length && !p.finishes.includes(item.finish)) ||
        (!p.finishes.length && item.finish)
      )
        throw new AppError(400, "Selecciona un acabado válido.");
      quantities.set(p.id, (quantities.get(p.id) || 0) + item.quantity);
      lines.push({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        image: p.image,
        quantity: item.quantity,
        finish: item.finish,
        unitPrice: p.salePrice ?? p.price,
        madeToOrder: p.madeToOrder,
        leadDays: p.leadDays,
      });
    }
    for (const [id, quantity] of [...quantities].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const p = products.find((p) => p.id === id)!;
      if (quantity > 20)
        throw new AppError(400, "Máximo 20 unidades por mueble.");
      if (!p.madeToOrder) {
        const updated = await tx.product.updateMany({
          where: { id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count !== 1)
          throw new AppError(
            409,
            `No quedan suficientes unidades de ${p.name}.`,
          );
        stockChanged = true;
      }
    }
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
    return tx.order.create({
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
  });
  if (stockChanged) invalidate("catalog");
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
  let stockChanged = false;
  const result = await transaction(async (tx) => {
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
          await tx.product.updateMany({
            where: { id: line.productId },
            data: { stock: { increment: line.quantity } },
          });
          stockChanged = true;
        }
      }
    }
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
    return updated;
  });
  if (stockChanged) invalidate("catalog");
  return result;
}
