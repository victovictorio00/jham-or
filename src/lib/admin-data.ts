import { db } from "./db";
import { requireAdmin } from "./auth";
import { adminCached, adminSectionTag } from "./admin-cache";
import { statuses } from "./shared";
export async function adminRows(
  section: string,
  q: string,
  page: number,
  stock = "",
  estado = "",
) {
  await requireAdmin(section === "equipo");
  return adminCached(
    JSON.stringify(["list", section, q, page, stock, estado]),
    [adminSectionTag[section]],
    async () => {
      const p = { stock, estado };
      const skip = (page - 1) * 30,
        take = 31;
      const search = (field: string) =>
        q ? { [field]: { contains: q, mode: "insensitive" } } : {};
      let rows: Record<string, unknown>[] = [];
      if (section === "productos")
        rows = await db.product.findMany({
          where: {
            deletedAt: null,
            ...search("name"),
            ...(p.stock === "bajo"
              ? { madeToOrder: false, stock: { lte: 3 } }
              : {}),
          },
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            name: true,
            sku: true,
            image: true,
            price: true,
            salePrice: true,
            stock: true,
            madeToOrder: true,
            active: true,
            category: { select: { name: true } },
          },
        });
      else if (section === "categorias")
        rows = await db.category.findMany({
          where: search("name"),
          take,
          skip,
          orderBy: [{ position: "asc" }, { id: "asc" }],
          include: {
            _count: { select: { products: { where: { deletedAt: null } } } },
          },
        });
      else if (section === "pedidos")
        rows = await db.order.findMany({
          where: {
            ...(p.estado && statuses[p.estado] ? { status: p.estado } : {}),
            ...(q
              ? {
                  OR: [
                    { customerName: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                    ...(Number.isSafeInteger(Number(q.replace(/^JO-/, ""))) &&
                    Number(q.replace(/^JO-/, "")) > 0
                      ? [{ number: Number(q.replace(/^JO-/, "")) }]
                      : []),
                  ],
                }
              : {}),
          },
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            number: true,
            customerName: true,
            email: true,
            status: true,
            paymentStatus: true,
            total: true,
            createdAt: true,
          },
        });
      else if (section === "clientes" || section === "equipo")
        rows = await db.user.findMany({
          where: {
            role:
              section === "clientes" ? "CUSTOMER" : { in: ["ADMIN", "OWNER"] },
            ...(q
              ? {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            active: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        });
      else if (section === "paginas")
        rows = await db.page.findMany({
          where: search("title"),
          take,
          skip,
          orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
            updatedAt: true,
          },
        });
      else if (section === "cupones")
        rows = await db.coupon.findMany({
          where: search("code"),
          take,
          skip,
          orderBy: { code: "asc" },
        });
      else if (section === "historial")
        rows = await db.audit.findMany({
          where: q
            ? {
                OR: [
                  { actor: { contains: q, mode: "insensitive" } },
                  { summary: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
      else if (section === "media")
        rows = await db.media.findMany({
          where: search("name"),
          take,
          skip,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        });
      return rows;
    },
  );
}
export async function categoryOptions() {
  await requireAdmin();
  return adminCached("category-options", ["categories"], () =>
    db.category.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
  );
}
export async function adminRecord(section: string, id: string) {
  await requireAdmin(section === "equipo");
  return adminCached(
    JSON.stringify(["record", section, id]),
    [adminSectionTag[section]],
    async () => {
      if (section === "productos")
        return db.product.findUnique({ where: { id } });
      if (section === "categorias")
        return db.category.findUnique({ where: { id } });
      if (section === "paginas") return db.page.findUnique({ where: { id } });
      if (section === "cupones") return db.coupon.findUnique({ where: { id } });
      if (section === "pedidos") return db.order.findUnique({ where: { id } });
      if (section === "clientes" || section === "equipo") {
        const user = await db.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            active: true,
          },
        });
        if (user && section === "clientes" && user.role !== "CUSTOMER")
          return null;
        return user;
      }
      return null;
    },
  );
}
type Overview = {
  orders: {
    id: string;
    number: number;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  pending: number;
  revenue: number;
  products: number;
  customers: number;
  lowStock: { id: string; name: string; stock: number }[];
};
export async function adminOverview() {
  await requireAdmin();
  return adminCached("overview", ["overview"], async () => {
    const rows = await db.$queryRaw<
      { value: Overview }[]
    >`SELECT jsonb_build_object(
   'pending',(SELECT count(*)::int FROM "Order" WHERE "status"='PENDING'),
   'revenue',(SELECT coalesce(sum("total"),0)::float8 FROM "Order" WHERE "paymentStatus"='PAID' AND "status"<>'CANCELLED'),
   'products',(SELECT count(*)::int FROM "Product" WHERE "deletedAt" IS NULL),
   'customers',(SELECT count(*)::int FROM "User" WHERE "role"='CUSTOMER'),
   'orders',coalesce((SELECT jsonb_agg(r) FROM (SELECT "id","number","customerName","total","status","createdAt" FROM "Order" ORDER BY "createdAt" DESC,"id" DESC LIMIT 6) r),'[]'::jsonb),
   'lowStock',coalesce((SELECT jsonb_agg(r) FROM (SELECT "id","name","stock" FROM "Product" WHERE "deletedAt" IS NULL AND "active"=true AND "madeToOrder"=false AND "stock"<=3 ORDER BY "stock","id" LIMIT 8) r),'[]'::jsonb)
  ) AS value`;
    return rows[0].value;
  });
}
