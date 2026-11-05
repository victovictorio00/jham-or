import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { adminPage } from "@/lib/auth";
import { settings } from "@/lib/catalog";
import { mediaOptions as imageOptions } from "@/lib/media-options";
import {
  Editor,
  MediaUpload,
  MediaCard,
  OrderEditor,
} from "@/components/admin";
import { money, statuses } from "@/lib/shared";
const sections: Record<
  string,
  { title: string; description: string; create?: string }
> = {
  productos: {
    title: "Muebles",
    description: "Cada pieza de tu colección, con todos sus detalles.",
    create: "Añadir mueble",
  },
  categorias: {
    title: "Categorías",
    description: "Organiza los espacios de tu tienda.",
    create: "Añadir categoría",
  },
  pedidos: {
    title: "Pedidos",
    description: "De la primera selección a la entrega en casa.",
  },
  clientes: {
    title: "Clientes",
    description: "Personas que hacen de Jham-or parte de su hogar.",
  },
  equipo: {
    title: "Equipo y permisos",
    description: "Controla quién puede administrar tu tienda.",
    create: "Añadir miembro",
  },
  media: {
    title: "Fotos e imágenes",
    description: "Biblioteca optimizada para una web más rápida.",
  },
  paginas: {
    title: "Páginas y SEO",
    description: "Información, políticas y contenido de tu tienda.",
    create: "Añadir página",
  },
  cupones: {
    title: "Cupones",
    description: "Descuentos para ocasiones especiales.",
    create: "Crear cupón",
  },
  configuracion: {
    title: "Diseño y tienda",
    description: "Portada, textos, contacto, envíos y atención.",
  },
  historial: {
    title: "Historial de cambios",
    description: "Acciones del equipo y trazabilidad de tu negocio.",
  },
};
const json = (v: unknown) => JSON.parse(JSON.stringify(v));
export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await adminPage();
  const section = (await params).section;
  const info = sections[section];
  if (!info) notFound();
  if (section === "equipo" && actor.role !== "OWNER")
    return (
      <div className="panel">
        <h1>Equipo y permisos</h1>
        <p>Solo el propietario puede gestionar accesos del equipo.</p>
      </div>
    );
  const p = await searchParams;
  const edit = p.edit;
  const q = (p.q || "").slice(0, 100);
  const page = Math.min(1000, Math.max(1, Number(p.pagina) || 1));
  const skip = (page - 1) * 30;
  const take = 31;
  const search = (field: string) =>
    q ? { [field]: { contains: q, mode: "insensitive" } } : {};
  if (section === "configuracion") {
    const [storeSettings, images] = await Promise.all([
      settings(),
      imageOptions(),
    ]);
    return (
      <>
        <div className="admin-title">
          <div>
            <h1>{info.title}</h1>
            <p>{info.description}</p>
          </div>
          <Link href="/" target="_blank" className="button outline">
            Ver mi tienda ↗
          </Link>
        </div>
        <div className="panel">
          <Editor section={section} initial={storeSettings} images={images} />
        </div>
      </>
    );
  }
  if (edit) {
    let initial: unknown = { active: true };
    if (edit !== "new") {
      if (!/^[a-f0-9-]{36}$/.test(edit)) notFound();
      if (section === "productos")
        initial = await db.product.findUnique({ where: { id: edit } });
      else if (section === "categorias")
        initial = await db.category.findUnique({ where: { id: edit } });
      else if (section === "paginas")
        initial = await db.page.findUnique({ where: { id: edit } });
      else if (section === "cupones")
        initial = await db.coupon.findUnique({ where: { id: edit } });
      else if (section === "clientes" || section === "equipo") {
        initial = await db.user.findUnique({
          where: { id: edit },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            active: true,
          },
        });
        if (
          initial &&
          section === "clientes" &&
          (initial as { role: string }).role !== "CUSTOMER"
        )
          notFound();
      } else if (section === "pedidos")
        initial = await db.order.findUnique({ where: { id: edit } });
      else notFound();
      if (!initial) notFound();
    } else if (!info.create) notFound();
    if (section === "productos" && edit === "new")
      initial = {
        active: true,
        price: 0,
        salePrice: null,
        gallery: [],
        finishes: [],
        stock: 0,
        leadDays: 7,
        madeToOrder: false,
        featured: false,
      };
    if (section === "categorias" && edit === "new")
      initial = { active: true, position: 0, description: "", image: "" };
    if (section === "equipo" && edit === "new")
      initial = { active: true, role: "ADMIN", phone: "" };
    if (section === "paginas" && edit === "new")
      initial = { published: false, content: "", seoDescription: "" };
    if (section === "cupones" && edit === "new")
      initial = { active: true, minimum: 0, percent: 10, expiresAt: null };
    const [cats, images] =
      section === "productos"
        ? await Promise.all([
            db.category.findMany({
              orderBy: { position: "asc" },
              select: { id: true, name: true },
            }),
            imageOptions(),
          ])
        : [[], section === "categorias" ? await imageOptions() : []];
    return (
      <>
        <Link href={`/admin/${section}`} className="text-link">
          ← {info.title}
        </Link>
        <div className="admin-title">
          <h1>
            {edit === "new"
              ? info.create
              : section === "pedidos"
                ? `Pedido JO-${String((initial as { number: number }).number).padStart(5, "0")}`
                : "Editar " + info.title.toLowerCase()}
          </h1>
        </div>
        {section === "pedidos" ? (
          <OrderEditor key={JSON.stringify(initial)} order={json(initial)} />
        ) : (
          <div className="panel">
            <Editor
              section={section}
              initial={json(initial)}
              categories={cats}
              images={images}
            />
          </div>
        )}
      </>
    );
  }
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
      orderBy: { createdAt: "desc" },
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
      orderBy: { position: "asc" },
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
                ...(Number(q.replace(/^JO-/, "")) > 0
                  ? [{ number: Number(q.replace(/^JO-/, "")) }]
                  : []),
              ],
            }
          : {}),
      },
      take,
      skip,
      orderBy: { createdAt: "desc" },
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
        role: section === "clientes" ? "CUSTOMER" : { in: ["ADMIN", "OWNER"] },
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
      orderBy: { createdAt: "desc" },
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
      orderBy: { updatedAt: "desc" },
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
      orderBy: { createdAt: "desc" },
    });
  else if (section === "media")
    rows = await db.media.findMany({
      where: search("name"),
      take,
      skip,
      orderBy: { createdAt: "desc" },
    });
  const link = (id: unknown) => `/admin/${section}?edit=${id}`;
  const href = (n: number) =>
    `/admin/${section}?${new URLSearchParams({ ...(Object.fromEntries(Object.entries(p).filter(([k, v]) => k !== "pagina" && typeof v === "string")) as Record<string, string>), pagina: String(n) })}`;
  return (
    <>
      <div className="admin-title">
        <div>
          <h1>{info.title}</h1>
          <p>{info.description}</p>
        </div>
        <div className="actions">
          {section === "pedidos" && (
            <a href="/api/admin/export" className="button outline">
              Exportar CSV
            </a>
          )}
          {info.create && (
            <Link href={`/admin/${section}?edit=new`} className="button">
              + {info.create}
            </Link>
          )}
        </div>
      </div>
      {section === "media" && <MediaUpload />}
      <form className="admin-filters">
        <input
          name="q"
          placeholder="Buscar…"
          aria-label={`Buscar en ${info.title}`}
          defaultValue={q}
        />
        {section === "pedidos" && (
          <select
            name="estado"
            aria-label="Estado del pedido"
            defaultValue={p.estado || ""}
          >
            <option value="">Todos los estados</option>
            {Object.entries(statuses).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        )}
        {section === "productos" && (
          <select
            name="stock"
            aria-label="Filtrar inventario"
            defaultValue={p.stock || ""}
          >
            <option value="">Todo el inventario</option>
            <option value="bajo">Stock bajo (3 o menos)</option>
          </select>
        )}
        <button className="button small-button">Buscar</button>
        <Link href={`/admin/${section}`} className="text-link small">
          Limpiar
        </Link>
      </form>
      {section === "media" ? (
        <div className="media-grid">
          {rows.slice(0, 30).map((row) => (
            <MediaCard key={String(row.id)} item={json(row)} />
          ))}
        </div>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                {(section === "productos"
                  ? ["Mueble", "Categoría", "Precio", "Inventario", "Estado"]
                  : section === "categorias"
                    ? ["Nombre", "Enlace", "Muebles", "Estado"]
                    : section === "pedidos"
                      ? [
                          "Pedido",
                          "Cliente",
                          "Fecha",
                          "Estado",
                          "Pago",
                          "Total",
                        ]
                      : section === "clientes" || section === "equipo"
                        ? [
                            "Nombre",
                            "Correo",
                            "Teléfono",
                            "Permiso",
                            "Pedidos",
                            "Estado",
                          ]
                        : section === "paginas"
                          ? ["Título", "Enlace", "Estado", "Actualizada"]
                          : section === "cupones"
                            ? [
                                "Código",
                                "Descuento",
                                "Mínimo",
                                "Vence",
                                "Estado",
                              ]
                            : [
                                "Fecha",
                                "Usuario",
                                "Acción",
                                "Recurso",
                                "Detalle",
                              ]
                ).map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((r) => (
                <tr key={String(r.id)}>
                  {section === "productos" ? (
                    <>
                      <td>
                        <Link className="table-product" href={link(r.id)}>
                          <Image
                            src={String(r.image)}
                            alt=""
                            width={50}
                            height={50}
                          />
                          <div>
                            <strong>{String(r.name)}</strong>
                            <small>{String(r.sku)}</small>
                          </div>
                        </Link>
                      </td>
                      <td>{(r.category as { name: string }).name}</td>
                      <td>{money(Number(r.salePrice ?? r.price))}</td>
                      <td>{r.madeToOrder ? "A pedido" : `${r.stock} ud.`}</td>
                      <td>
                        <span className="status">
                          {r.active ? "Visible" : "Oculto"}
                        </span>
                      </td>
                    </>
                  ) : section === "categorias" ? (
                    <>
                      <td>
                        <Link href={link(r.id)}>{String(r.name)}</Link>
                      </td>
                      <td>{String(r.slug)}</td>
                      <td>{(r._count as { products: number }).products}</td>
                      <td>{r.active ? "Visible" : "Oculta"}</td>
                    </>
                  ) : section === "pedidos" ? (
                    <>
                      <td>
                        <Link href={link(r.id)}>
                          JO-{String(r.number).padStart(5, "0")}
                        </Link>
                      </td>
                      <td>
                        {String(r.customerName)}
                        <small>{String(r.email)}</small>
                      </td>
                      <td>
                        {new Date(String(r.createdAt)).toLocaleDateString(
                          "es-PE",
                          { timeZone: "America/Lima" },
                        )}
                      </td>
                      <td>
                        <span
                          className={`status ${String(r.status).toLowerCase()}`}
                        >
                          {statuses[String(r.status)]}
                        </span>
                      </td>
                      <td>
                        {r.paymentStatus === "PAID"
                          ? "Pagado"
                          : r.paymentStatus === "REFUNDED"
                            ? "Reembolsado"
                            : "Pendiente"}
                      </td>
                      <td>{money(Number(r.total))}</td>
                    </>
                  ) : section === "clientes" || section === "equipo" ? (
                    <>
                      <td>
                        <Link href={link(r.id)}>{String(r.name)}</Link>
                      </td>
                      <td>{String(r.email)}</td>
                      <td>{String(r.phone)}</td>
                      <td>
                        {r.role === "OWNER"
                          ? "Propietario"
                          : r.role === "ADMIN"
                            ? "Administrador"
                            : "Cliente"}
                      </td>
                      <td>{(r._count as { orders: number }).orders}</td>
                      <td>{r.active ? "Activa" : "Desactivada"}</td>
                    </>
                  ) : section === "paginas" ? (
                    <>
                      <td>
                        <Link href={link(r.id)}>{String(r.title)}</Link>
                      </td>
                      <td>
                        <Link href={`/paginas/${r.slug}`} target="_blank">
                          /{String(r.slug)} ↗
                        </Link>
                      </td>
                      <td>{r.published ? "Publicada" : "Borrador"}</td>
                      <td>
                        {new Date(String(r.updatedAt)).toLocaleDateString(
                          "es-PE",
                        )}
                      </td>
                    </>
                  ) : section === "cupones" ? (
                    <>
                      <td>
                        <Link href={link(r.id)}>{String(r.code)}</Link>
                      </td>
                      <td>{String(r.percent)} %</td>
                      <td>{money(Number(r.minimum))}</td>
                      <td>
                        {r.expiresAt
                          ? new Date(String(r.expiresAt)).toLocaleDateString(
                              "es-PE",
                            )
                          : "Sin vencimiento"}
                      </td>
                      <td>{r.active ? "Activo" : "Inactivo"}</td>
                    </>
                  ) : (
                    <>
                      <td>
                        {new Date(String(r.createdAt)).toLocaleString("es-PE", {
                          timeZone: "America/Lima",
                        })}
                      </td>
                      <td>{String(r.actor)}</td>
                      <td>{String(r.action)}</td>
                      <td>{String(r.entity)}</td>
                      <td>{String(r.summary)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="empty">
              <h3>No hay resultados.</h3>
              <p>Prueba con otra búsqueda o añade el primer registro.</p>
            </div>
          )}
        </div>
      )}
      <div className="pagination">
        {page > 1 && (
          <Link href={href(page - 1)} className="button outline">
            Anterior
          </Link>
        )}
        <span>Página {page}</span>
        {rows.length > 30 && (
          <Link href={href(page + 1)} className="button outline">
            Siguiente
          </Link>
        )}
      </div>
    </>
  );
}
