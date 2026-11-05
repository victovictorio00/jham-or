import { cookies } from "next/headers";
import { z } from "zod";
import { compare, hash as passwordHash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  AppError,
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
import { placeOrder, changeOrder } from "@/lib/orders";
import { writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handler(req: Request, context: Context) {
  try {
    const { path } = await context.params;
    const route = path.join("/");
    const method = req.method;
    if (method !== "GET") sameOrigin(req);
    if (route === "health" && method === "GET") {
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
      if (resource === "upload" && method === "POST") {
        await rateLimit(`upload:${actor.id}`, 100);
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
          throw new AppError(400, "Selecciona una imagen de hasta 5 MB.");
        const bytes = Buffer.from(await file.arrayBuffer());
        let output;
        try {
          output = await sharp(bytes, {
            limitInputPixels: 25000000,
            animated: false,
          })
            .rotate()
            .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer({ resolveWithObject: true });
        } catch {
          throw new AppError(
            400,
            "Imagen no válida. Usa JPG, PNG, WebP o AVIF.",
          );
        }
        const name = randomUUID() + ".webp";
        await mkdir(process.env.UPLOAD_DIR || "uploads", { recursive: true });
        await writeFile(
          `${process.env.UPLOAD_DIR || "uploads"}/${name}`,
          output.data,
        );
        const media = await db.media.create({
          data: {
            url: "/media/" + name,
            name: file.name.slice(0, 200),
            alt: file.name.slice(0, 200),
            size: output.data.length,
            width: output.info.width,
            height: output.info.height,
          },
        });
        return Response.json(media, { status: 201 });
      }
      if (resource === "settings" && method === "PUT") {
        const data = settingsSchema.parse(await req.json());
        const previous = await db.setting.findUnique({
          where: { key: "store" },
        });
        if (JSON.stringify(previous?.value) === JSON.stringify(data))
          return Response.json({ ok: true, unchanged: true });
        await db.$transaction([
          db.setting.upsert({
            where: { key: "store" },
            create: { key: "store", value: data },
            update: { value: data },
          }),
          db.audit.create({
            data: {
              actor: actor.email,
              action: "UPDATE",
              entity: "settings",
              entityId: "store",
              summary: "Configuración de tienda actualizada",
            },
          }),
        ]);
        invalidate("settings");
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
        if (data.role !== "CUSTOMER" || previous?.role !== "CUSTOMER")
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
        )
          return Response.json({ ok: true, unchanged: true });
        const operation = id
          ? model.update({ where: { id }, data })
          : model.create({ data });
        await db.$transaction([
          operation,
          db.audit.create({
            data: {
              actor: actor.email,
              action:
                method === "DELETE" ? "ARCHIVE" : id ? "UPDATE" : "CREATE",
              entity: resource,
              entityId: id || "new",
              summary: String(
                data.name ||
                  data.title ||
                  data.code ||
                  previous?.name ||
                  resource,
              ),
            },
          }),
        ]);
        invalidate(
          resource === "pages"
            ? "pages"
            : resource === "coupons"
              ? "coupons"
              : "catalog",
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
        return Response.json({ ok: true });
      }
      throw new AppError(404, "Operación no disponible.");
    }
    throw new AppError(404, "Ruta no encontrada.");
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return Response.json(
        { error: "Ya existe un registro con ese correo, enlace o código." },
        { status: 409 },
      );
    return failure(e);
  }
}
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
