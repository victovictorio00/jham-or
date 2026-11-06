import { fieldLabels } from "@/lib/field-errors";
import { cookies } from "next/headers";
import { z } from "zod";
import { compare, hash as passwordHash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  AppError,
  withRequestAuth,
  currentUser,
  requireUser,
  requireAdmin,
  createSession,
  cookieName,
  hash,
  rateLimit,
  sameOrigin,
  failure,
} from "@/lib/auth";
import {
  productSchema,
  categorySchema,
  pageSchema,
  couponSchema,
  settingsSchema,
} from "@/lib/validation";
import { invalidate } from "@/lib/catalog";
import { markPublication, recoverPublication } from "@/lib/publication";
import {
  publishAndInvalidate,
  retryPendingPublication,
} from "@/lib/publish-runtime";
import { publicWarmupManifest } from "@/lib/prewarm";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { access } from "node:fs/promises";
import { placeOrder, changeOrder } from "@/lib/orders";
import { uploadImage } from "@/lib/upload";
import { invalidateAdmin, adminSectionTag } from "@/lib/admin-cache";
import { mediaOptions } from "@/lib/media-options";
import { transaction } from "@/lib/transaction";
import {
  deleteMedia,
  lockMediaReferences,
  validateMediaReferences,
} from "@/lib/media";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handler(req: Request, context: Context) {
  try {
    const { path } = await context.params;
    const route = path.join("/");
    const method = req.method;
    if (route === "internal/prepare" && method === "POST") {
      const expected = process.env.JHAMOR_WARM_TOKEN;
      const supplied =
        req.headers.get("authorization")?.replace(/^Bearer /, "") || "";
      if (
        !expected ||
        !timingSafeEqual(
          Buffer.from(hash(expected)),
          Buffer.from(hash(supplied)),
        )
      )
        throw new AppError(404, "Ruta no encontrada.");
      const recovery = await recoverPublication();
      for (const tag of ["settings", "catalog", "pages"]) invalidate(tag);
      revalidatePath("/", "layout");
      revalidatePath("/sitemap.xml");
      return Response.json({
        ...(await publicWarmupManifest()),
        recovered: recovery.recovered,
      });
    }
    if (method !== "GET") sameOrigin(req);
    if (route === "health" && method === "GET") {
      if (process.env.JHAMOR_MANAGED_STARTUP === "1") {
        try {
          await access("/tmp/jhamor-ready");
        } catch {
          return Response.json(
            { ok: false, status: "warming" },
            { status: 503 },
          );
        }
      }
      await db.$queryRaw`SELECT 1`;
      return Response.json({ ok: true });
    }
    if (route === "quote" && method === "POST") {
      const user = await requireUser();
      await rateLimit(`quote:${user.id}`, 100);
      const data = z
        .object({
          items: z
            .array(
              z.object({
                productId: z.uuid(),
                quantity: z.number().int().min(1).max(20),
              }),
            )
            .min(1)
            .max(30),
          coupon: z.string().trim().min(3).max(30),
        })
        .parse(await req.json());
      const products = await db.product.findMany({
        where: {
          id: { in: data.items.map((i) => i.productId) },
          active: true,
          deletedAt: null,
          category: { active: true },
        },
        select: { id: true, price: true, salePrice: true },
      });
      let subtotal = 0;
      for (const line of data.items) {
        const product = products.find((p) => p.id === line.productId);
        if (!product)
          throw new AppError(409, "Uno de los muebles ya no está disponible.");
        subtotal += (product.salePrice ?? product.price) * line.quantity;
      }
      const coupon = await db.coupon.findUnique({
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
      return Response.json(
        {
          code: coupon.code,
          subtotal,
          discount: Math.floor((subtotal * coupon.percent) / 100),
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (route === "auth/me" && method === "GET")
      return Response.json(
        { user: await currentUser() },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    if (route === "auth/logout" && method === "POST") {
      const jar = await cookies();
      const token = jar.get(cookieName)?.value;
      if (token)
        await db.session.deleteMany({ where: { tokenHash: hash(token) } });
      jar.delete(cookieName);
      return Response.json({ ok: true });
    }
    if (route === "auth/login" || route === "auth/register") {
      if (method !== "POST") throw new AppError(405, "Método no permitido.");
      const body = await req.json();
      const email = z.email().max(254).parse(body.email).toLowerCase();
      await rateLimit(`auth:${email}`, 12);
      await rateLimit(
        `auth-ip:${req.headers.get("x-real-ip") || "local"}`,
        100,
      );
      if (route === "auth/register") {
        const data = z
          .object({
            name: z.string().trim().min(2).max(150),
            phone: z.string().trim().min(7).max(30),
            password: z.string().min(12).max(128),
          })
          .parse(body);
        const password = await passwordHash(data.password, 12);
        try {
          const u = await db.user.create({
            data: {
              name: data.name,
              phone: data.phone,
              email,
              passwordHash: password,
            },
          });
          invalidateAdmin("customers", "overview");
          await createSession(u.id);
          return Response.json({ ok: true }, { status: 201 });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === "P2002"
          )
            throw new AppError(
              409,
              "No se pudo registrar este correo. Prueba iniciar sesión.",
            );
          throw e;
        }
      }
      const password = z.string().max(128).parse(body.password);
      const u = await db.user.findUnique({ where: { email } });
      const valid = await compare(
        password,
        u?.passwordHash ||
          "$2b$12$JmJZlpm3RkRg2i57gPE45Ow26RwlRY5X3Rt3YKqzkVDsCa2IbVloW",
      );
      if (!u || !u.active || !valid)
        throw new AppError(401, "Correo o contraseña incorrectos.");
      await createSession(u.id);
      return Response.json({ ok: true });
    }
    if (route === "account" && method === "PATCH") {
      const u = await requireUser();
      const data = z
        .object({
          name: z.string().trim().min(2).max(150),
          phone: z.string().trim().min(7).max(30),
          currentPassword: z.string().max(128).optional(),
          password: z.string().min(12).max(128).optional(),
        })
        .parse(await req.json());
      if (data.password) {
        const full = await db.user.findUniqueOrThrow({ where: { id: u.id } });
        if (
          !data.currentPassword ||
          !(await compare(data.currentPassword, full.passwordHash))
        )
          throw new AppError(400, "La contraseña actual no es correcta.");
        await db.$transaction([
          db.user.update({
            where: { id: u.id },
            data: {
              name: data.name,
              phone: data.phone,
              passwordHash: await passwordHash(data.password, 12),
            },
          }),
          db.session.deleteMany({ where: { userId: u.id } }),
        ]);
        await createSession(u.id);
      } else
        await db.user.update({
          where: { id: u.id },
          data: { name: data.name, phone: data.phone },
        });
      invalidateAdmin("customers", "team");
      return Response.json({ ok: true });
    }
    if (route === "orders" && method === "POST") {
      const u = await requireUser();
      await rateLimit(`orders:${u.id}`, 60);
      return Response.json(await placeOrder(u, await req.json()), {
        status: 201,
      });
    }
    if (path[0] === "admin") {
      const actor = await requireAdmin();
      const resource = path[1];
      const id = path[2];
      if (resource === "refresh" && method === "POST") {
        const { section } = z
          .object({
            section: z.enum(
              Object.keys(adminSectionTag) as [string, ...string[]],
            ),
          })
          .parse(await req.json());
        if (section === "equipo") await requireAdmin(true);
        invalidateAdmin(adminSectionTag[section]);
        return Response.json({ ok: true });
      }
      if (resource === "orders" && method === "PATCH") {
        if (!id) throw new AppError(400, "Falta el pedido.");
        return Response.json(
          await changeOrder(id, actor.email, await req.json()),
        );
      }
      if (resource === "export" && method === "GET") {
        const orders = await db.order.findMany({
          take: 5000,
          orderBy: { createdAt: "desc" },
          select: {
            number: true,
            createdAt: true,
            customerName: true,
            email: true,
            status: true,
            paymentStatus: true,
            total: true,
          },
        });
        const escape = (v: unknown) =>
          '"' +
          String(v ?? "")
            .replace(/^[=+@-]/, "'" + String(v ?? "").charAt(0))
            .replaceAll('"', '""') +
          '"';
        return new Response(
          "\uFEFF" +
            [
              [
                "Pedido",
                "Fecha",
                "Cliente",
                "Correo",
                "Estado",
                "Pago",
                "Total S/",
              ],
              ...orders.map((o) => [
                `JO-${o.number}`,
                o.createdAt.toISOString(),
                o.customerName,
                o.email,
                o.status,
                o.paymentStatus,
                (o.total / 100).toFixed(2),
              ]),
            ]
              .map((r) => r.map(escape).join(","))
              .join("\r\n"),
          {
            headers: {
              "Content-Type": "text/csv;charset=utf-8",
              "Content-Disposition":
                'attachment; filename="jhamor-pedidos.csv"',
              "Cache-Control": "private, no-store",
            },
          },
        );
      }
      if (resource === "media-options" && method === "GET")
        return Response.json(
          { items: await mediaOptions() },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      if (resource === "media" && id && method === "DELETE")
        return Response.json(
          await deleteMedia(z.uuid().parse(id), actor.email),
        );
      if (resource === "upload" && method === "POST") {
        await rateLimit(`upload:${actor.id}`, 100);
        return await uploadImage(req);
      }
      if (resource === "settings" && method === "PUT") {
        const data = settingsSchema.parse(await req.json());
        const previous = await db.setting.findUnique({
          where: { key: "store" },
        });
        if (
          previous &&
          Object.entries(data).every(
            ([key, value]) =>
              JSON.stringify(
                (previous.value as Record<string, unknown>)[key],
              ) === JSON.stringify(value),
          )
        ) {
          await retryPendingPublication("settings");
          return Response.json({ ok: true, unchanged: true });
        }
        await transaction(async (tx) => {
          await lockMediaReferences(tx);
          await validateMediaReferences(tx, data.heroImage);
          await tx.setting.upsert({
            where: { key: "store" },
            create: { key: "store", value: data },
            update: { value: data },
          });
          await tx.audit.create({
            data: {
              actor: actor.email,
              action: "UPDATE",
              entity: "settings",
              entityId: "store",
              summary: "Configuración de tienda actualizada",
            },
          });
          await markPublication(tx, "settings");
        });
        invalidateAdmin("audit");
        await publishAndInvalidate("settings");
        return Response.json({ ok: true });
      }
      if (resource === "users" && (method === "POST" || method === "PATCH")) {
        const data = z
          .object({
            name: z.string().trim().min(2).max(150),
            email: z.email().transform((x) => x.toLowerCase()),
            phone: z.string().trim().max(30),
            role: z.enum(["CUSTOMER", "ADMIN", "OWNER"]),
            active: z.boolean(),
            password: z.string().min(12).max(128).optional(),
          })
          .parse(await req.json());
        const previous = id
          ? await db.user.findUnique({ where: { id } })
          : null;
        if (id && !previous) throw new AppError(404, "Usuario no encontrado.");
        if (
          data.role !== "CUSTOMER" ||
          (previous && previous.role !== "CUSTOMER")
        )
          await requireAdmin(true);
        if (id === actor.id && (data.role !== actor.role || !data.active))
          throw new AppError(400, "No puedes quitarte tu propio acceso.");
        if (
          previous?.role === "OWNER" &&
          (data.role !== "OWNER" || !data.active)
        )
          throw new AppError(
            400,
            "Conserva el propietario. Puedes desactivar administradores.",
          );
        if (!id && !data.password)
          throw new AppError(
            400,
            "Introduce una contraseña inicial de 12 caracteres como mínimo.",
          );
        const { password, ...fields } = data;
        const result = await db.$transaction(async (tx) => {
          const u = id
            ? await tx.user.update({
                where: { id },
                data: {
                  ...fields,
                  ...(password
                    ? { passwordHash: await passwordHash(password, 12) }
                    : {}),
                },
              })
            : await tx.user.create({
                data: {
                  ...fields,
                  passwordHash: await passwordHash(password!, 12),
                },
              });
          if (id && (!data.active || password || previous?.role !== data.role))
            await tx.session.deleteMany({ where: { userId: id } });
          await tx.audit.create({
            data: {
              actor: actor.email,
              action: id ? "UPDATE" : "CREATE",
              entity: "users",
              entityId: u.id,
              summary: `Cuenta ${u.email} (${u.role})`,
            },
          });
          return u;
        });
        invalidateAdmin("customers", "team", "overview", "audit");
        return Response.json({ id: result.id });
      }
      const schemas = {
        products: productSchema,
        categories: categorySchema,
        pages: pageSchema,
        coupons: couponSchema,
      };
      if (
        resource in schemas &&
        (method === "POST" || method === "PATCH" || method === "DELETE")
      ) {
        const schema = schemas[resource as keyof typeof schemas];
        const model = {
          products: db.product,
          categories: db.category,
          pages: db.page,
          coupons: db.coupon,
        }[resource as keyof typeof schemas] as unknown as {
          findUnique: (a: unknown) => Promise<Record<string, unknown> | null>;
          create: (a: unknown) => Prisma.PrismaPromise<{ id: string }>;
          update: (a: unknown) => Prisma.PrismaPromise<{ id: string }>;
        };
        let data: Record<string, unknown>;
        const previous = id ? await model.findUnique({ where: { id } }) : null;
        if (id && !previous) throw new AppError(404, "Registro no encontrado.");
        if (method === "DELETE") {
          if (!id) throw new AppError(400, "Falta el registro.");
          data =
            resource === "products"
              ? { active: false, deletedAt: new Date() }
              : resource === "pages"
                ? { published: false }
                : { active: false };
        } else data = schema.parse(await req.json());
        if (
          previous &&
          Object.entries(data).every(
            ([key, value]) =>
              JSON.stringify(previous[key]) === JSON.stringify(value),
          )
        ) {
          if (resource !== "coupons")
            await retryPendingPublication(
              resource === "pages" ? "pages" : "catalog",
            );
          return Response.json({ ok: true, unchanged: true });
        }
        await transaction(async (tx) => {
          if (resource !== "coupons") {
            await lockMediaReferences(tx);
            await validateMediaReferences(tx, data);
          }
          const txModel = {
            products: tx.product,
            categories: tx.category,
            pages: tx.page,
            coupons: tx.coupon,
          }[resource as keyof typeof schemas] as unknown as typeof model;
          const saved = id
            ? await txModel.update({ where: { id }, data })
            : await txModel.create({ data });
          await tx.audit.create({
            data: {
              actor: actor.email,
              action:
                method === "DELETE" ? "ARCHIVE" : id ? "UPDATE" : "CREATE",
              entity: resource,
              entityId: saved.id,
              summary: String(
                data.name ||
                  data.title ||
                  data.code ||
                  previous?.name ||
                  resource,
              ),
            },
          });
          if (resource !== "coupons")
            await markPublication(
              tx,
              resource === "pages" ? "pages" : "catalog",
            );
        });
        if (resource === "products" || resource === "categories")
          invalidateAdmin("products", "categories", "overview", "audit");
        else invalidateAdmin(resource as "pages" | "coupons", "audit");
        if (resource !== "coupons")
          await publishAndInvalidate(
            resource === "pages" ? "pages" : "catalog",
          );
        return Response.json({ ok: true });
      }
      if (resource === "media" && id && method === "PATCH") {
        const data = z
          .object({
            name: z.string().trim().min(1).max(200),
            alt: z.string().trim().max(300),
          })
          .parse(await req.json());
        await db.media.update({ where: { id }, data });
        invalidateAdmin("media", "media-options");
        return Response.json({ ok: true });
      }
      throw new AppError(404, "Operación no disponible.");
    }
    throw new AppError(404, "Ruta no encontrada.");
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const targets = Array.isArray(e.meta?.target)
        ? (e.meta.target as string[])
        : [];
      const fieldErrors = Object.fromEntries(
        targets
          .filter((key) => fieldLabels[key])
          .map((key) => [
            key,
            `Ya existe otro registro con este ${key === "sku" ? "código interno" : key === "slug" ? "enlace" : fieldLabels[key].toLowerCase()}. Usa uno diferente.`,
          ]),
      );
      return Response.json(
        {
          error:
            "Ya existe un registro con esos datos. Revisa los campos señalados.",
          fieldErrors,
        },
        { status: 409 },
      );
    }
    return failure(e);
  }
}
const scopedHandler = (req: Request, context: Context) =>
  withRequestAuth(() => handler(req, context));
export const GET = scopedHandler;
export const POST = scopedHandler;
export const PUT = scopedHandler;
export const PATCH = scopedHandler;
export const DELETE = scopedHandler;
