"use client";
import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Armchair,
  Tags,
  ClipboardList,
  Users,
  ImageIcon,
  FileText,
  Ticket,
  Settings,
  History,
  ExternalLink,
  Menu,
  X,
  Save,
  Upload,
} from "lucide-react";
import { request, Logout } from "./forms";
import { money, statuses, transitions } from "@/lib/shared";
import type { OrderLine } from "@/lib/orders";
const nav = [
  ["", "Resumen", LayoutDashboard],
  ["productos", "Muebles", Armchair],
  ["categorias", "Categorías", Tags],
  ["pedidos", "Pedidos", ClipboardList],
  ["clientes", "Clientes", Users],
  ["equipo", "Equipo y permisos", Users],
  ["media", "Imágenes", ImageIcon],
  ["paginas", "Páginas y SEO", FileText],
  ["cupones", "Cupones", Ticket],
  ["configuracion", "Diseño y tienda", Settings],
  ["historial", "Historial de cambios", History],
] as const;
export function AdminShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <Link href="/admin" className="wordmark">
          JHAM-OR<small>ADMINISTRACIÓN</small>
        </Link>
        <button
          className="icon-button close-sidebar"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <nav aria-label="Administración">
          {nav.map(([slug, label, Icon]) => (
            <Link
              href={`/admin${slug ? "/" + slug : ""}`}
              key={slug}
              onClick={() => setOpen(false)}
              className={
                path === `/admin${slug ? "/" + slug : ""}` ? "active" : ""
              }
              prefetch={false}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/" target="_blank" className="view-store">
          Ver mi tienda <ExternalLink size={16} />
        </Link>
        <p className="small">{name}</p>
        <Logout />
      </aside>
      <div className="admin-body">
        <header className="admin-header">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <span>Tu negocio, en orden.</span>
          <span>
            JHAM-OR <small>· PEN / S/</small>
          </span>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
};
const booleanFields = ["active", "featured", "madeToOrder", "published"];
const config: Record<string, { resource: string; fields: Field[] }> = {
  productos: {
    resource: "products",
    fields: [
      { key: "name", label: "Nombre", required: true },
      {
        key: "slug",
        label: "Enlace (slug)",
        required: true,
        help: "Solo minúsculas, números y guiones.",
      },
      { key: "sku", label: "Código interno / SKU", required: true },
      { key: "categoryId", label: "Categoría", type: "select", required: true },
      {
        key: "description",
        label: "Descripción",
        type: "textarea",
        required: true,
      },
      { key: "price", label: "Precio (S/)", type: "money", required: true },
      { key: "salePrice", label: "Precio de oferta (S/)", type: "money" },
      {
        key: "image",
        label: "Imagen principal",
        type: "image",
        required: true,
      },
      {
        key: "gallery",
        label: "Galería de imágenes",
        type: "images",
        help: "Hasta 10 imágenes.",
      },
      { key: "material", label: "Material", required: true },
      {
        key: "dimensions",
        label: "Medidas (ancho × fondo × alto)",
        required: true,
      },
      {
        key: "finishes",
        label: "Acabados",
        type: "lines",
        help: "Un acabado por línea.",
      },
      {
        key: "leadDays",
        label: "Plazo estimado en días",
        type: "number",
        required: true,
      },
      {
        key: "stock",
        label: "Unidades en stock",
        type: "number",
        required: true,
      },
      {
        key: "madeToOrder",
        label: "Fabricación a pedido (no descuenta stock)",
        type: "checkbox",
      },
      { key: "featured", label: "Destacado en la colección", type: "checkbox" },
      { key: "active", label: "Visible en tienda", type: "checkbox" },
    ],
  },
  categorias: {
    resource: "categories",
    fields: [
      { key: "name", label: "Nombre", required: true },
      { key: "slug", label: "Enlace (slug)", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
      { key: "image", label: "Imagen", type: "image" },
      { key: "position", label: "Orden", type: "number" },
      { key: "active", label: "Visible en tienda", type: "checkbox" },
    ],
  },
  paginas: {
    resource: "pages",
    fields: [
      { key: "title", label: "Título", required: true },
      { key: "slug", label: "Enlace (slug)", required: true },
      {
        key: "content",
        label: "Contenido de la página",
        type: "textarea",
        help: "Texto sin HTML. Conserva párrafos y saltos de línea.",
      },
      { key: "seoDescription", label: "Descripción para buscadores" },
      { key: "published", label: "Publicada", type: "checkbox" },
    ],
  },
  cupones: {
    resource: "coupons",
    fields: [
      { key: "code", label: "Código", required: true },
      {
        key: "percent",
        label: "Descuento (%)",
        type: "number",
        required: true,
      },
      { key: "minimum", label: "Compra mínima (S/)", type: "money" },
      { key: "expiresAt", label: "Vencimiento", type: "datetime-local" },
      { key: "active", label: "Activo", type: "checkbox" },
    ],
  },
  clientes: {
    resource: "users",
    fields: [
      { key: "name", label: "Nombre completo", required: true },
      {
        key: "email",
        label: "Correo electrónico",
        type: "email",
        required: true,
      },
      { key: "phone", label: "Teléfono" },
      { key: "active", label: "Cuenta habilitada", type: "checkbox" },
      {
        key: "password",
        label: "Nueva contraseña (opcional, mínimo 12 caracteres)",
        type: "password",
      },
    ],
  },
  equipo: {
    resource: "users",
    fields: [
      { key: "name", label: "Nombre completo", required: true },
      {
        key: "email",
        label: "Correo electrónico",
        type: "email",
        required: true,
      },
      { key: "phone", label: "Teléfono" },
      {
        key: "role",
        label: "Permiso",
        type: "select",
        options: [
          { value: "ADMIN", label: "Administrador" },
          { value: "OWNER", label: "Propietario" },
        ],
      },
      { key: "active", label: "Cuenta habilitada", type: "checkbox" },
      {
        key: "password",
        label:
          "Contraseña (mínimo 12 caracteres; déjala vacía para conservarla)",
        type: "password",
      },
    ],
  },
  configuracion: {
    resource: "settings",
    fields: [
      { key: "brand", label: "Nombre de la marca", required: true },
      { key: "tagline", label: "Lema" },
      {
        key: "heroTitle",
        label: "Título de portada",
        type: "textarea",
        required: true,
      },
      { key: "heroText", label: "Descripción de portada", type: "textarea" },
      { key: "heroImage", label: "Fotografía de portada", type: "image" },
      { key: "about", label: "Nuestra historia", type: "textarea" },
      { key: "footer", label: "Texto del pie de página" },
      { key: "email", label: "Correo de contacto", type: "email" },
      { key: "phone", label: "Teléfono" },
      {
        key: "whatsapp",
        label: "WhatsApp",
        help: "Código de país y número, solo dígitos.",
      },
      { key: "address", label: "Dirección del negocio" },
      { key: "hours", label: "Horario de atención" },
      { key: "deliveryArea", label: "Zona de cobertura", required: true },
      {
        key: "shippingFee",
        label: "Costo de envío (S/)",
        type: "money",
        required: true,
      },
      {
        key: "pickupAddress",
        label: "Dirección de recojo",
        help: "Vacío deshabilita el recojo en tienda.",
      },
      { key: "instagram", label: "Enlace de Instagram", type: "url" },
    ],
  },
};
export function Editor({
  section,
  initial = {},
  categories = [],
  images = [],
}: {
  section: string;
  initial?: Record<string, unknown>;
  categories?: { id: string; name: string }[];
  images?: { url: string; name: string }[];
}) {
  const router = useRouter();
  const c = config[section];
  const [values, setValues] = useState<Record<string, unknown>>({ ...initial });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const changed = JSON.stringify(values) !== JSON.stringify(initial);
  useEffect(() => {
    if (!changed) return;
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const click = (event: MouseEvent) => {
      const a = (event.target as HTMLElement).closest("a");
      if (
        a &&
        a.target !== "_blank" &&
        a.href !== location.href &&
        !confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [changed]);
  if (!c) return null;
  const set = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSuccess("");
  };
  function close() {
    if (
      changed &&
      !window.confirm("Hay cambios sin guardar. ¿Quieres descartarlos?")
    )
      return;
    router.push(`/admin/${section}`);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!changed && (initial.id || section === "configuracion")) {
      setSuccess("No hay cambios nuevos.");
      return;
    }
    setBusy(true);
    try {
      const body = { ...values };
      delete body.id;
      delete body.createdAt;
      delete body.updatedAt;
      delete body.deletedAt;
      delete body.category;
      delete body._count;
      for (const field of c.fields) {
        if (field.type === "checkbox")
          body[field.key] = Boolean(body[field.key]);
        else if (field.type === "money")
          body[field.key] =
            field.key === "salePrice" &&
            (body[field.key] === "" ||
              body[field.key] === null ||
              body[field.key] === undefined)
              ? null
              : Math.round(Number(body[field.key] || 0));
        else if (field.type === "number")
          body[field.key] = Number(body[field.key] || 0);
        else if (field.type === "lines" || field.type === "images")
          body[field.key] = Array.isArray(body[field.key])
            ? body[field.key]
            : String(body[field.key] || "")
                .split("\n")
                .map((x) => x.trim())
                .filter(Boolean);
        else if (field.type === "datetime-local")
          body[field.key] = body[field.key]
            ? new Date(String(body[field.key])).toISOString()
            : null;
        else body[field.key] = body[field.key] ?? "";
      }
      if (c.resource === "users") {
        if (!body.password) delete body.password;
        if (section === "clientes") body.role = "CUSTOMER";
      }
      await request(
        `/api/admin/${c.resource}${initial.id ? "/" + initial.id : ""}`,
        section === "configuracion" ? "PUT" : initial.id ? "PATCH" : "POST",
        body,
      );
      setSuccess("Cambios guardados.");
      if (section !== "configuracion") router.push(`/admin/${section}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="editor-form" onSubmit={save} ref={formRef}>
      <div className="editor-fields">
        {c.fields.map((f) => {
          let value = values[f.key];
          if (f.type === "money" && typeof value === "number")
            value = value / 100;
          const options =
            f.key === "categoryId"
              ? categories.map((c) => ({ value: c.id, label: c.name }))
              : f.options;
          const stored = values[f.key];
          return (
            <div
              key={f.key}
              className={
                ["textarea", "image", "images"].includes(f.type || "")
                  ? "full-field"
                  : ""
              }
            >
              {f.type === "checkbox" ? (
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(stored)}
                    onChange={(e) => set(f.key, e.target.checked)}
                  />
                  {f.label}
                </label>
              ) : (
                <label>
                  {f.label}
                  {f.type === "textarea" ? (
                    <textarea
                      rows={f.key === "content" ? 16 : 5}
                      aria-label={f.label}
                      value={String(value ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      required={f.required}
                      maxLength={f.key === "content" ? 30000 : 10000}
                    />
                  ) : f.type === "select" ? (
                    <select
                      aria-label={f.label}
                      value={String(value ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      required={f.required}
                    >
                      <option value="">Selecciona una opción</option>
                      {options?.map((o) => (
                        <option value={o.value} key={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "image" ? (
                    <div className="image-picker">
                      {Boolean(value) && (
                        <Image
                          src={String(value)}
                          alt="Imagen seleccionada"
                          width={100}
                          height={80}
                          unoptimized
                        />
                      )}
                      <select
                        aria-label={f.label}
                        value={String(value ?? "")}
                        onChange={(e) => set(f.key, e.target.value)}
                        required={f.required}
                      >
                        <option value="">Sin imagen</option>
                        {[
                          ...new Map(
                            [
                              ...images,
                              ...(value
                                ? [
                                    {
                                      url: String(value),
                                      name: "Imagen actual",
                                    },
                                  ]
                                : []),
                            ].map((i) => [i.url, i]),
                          ).values(),
                        ].map((i) => (
                          <option key={i.url} value={i.url}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                      <Link
                        href="/admin/media"
                        target="_blank"
                        className="small underlined"
                      >
                        Subir imágenes en otra pestaña
                      </Link>
                      <button
                        type="button"
                        className="text-button small"
                        onClick={() => router.refresh()}
                      >
                        Actualizar biblioteca
                      </button>
                    </div>
                  ) : f.type === "lines" || f.type === "images" ? (
                    <>
                      <textarea
                        rows={4}
                        value={
                          Array.isArray(value)
                            ? value.join("\n")
                            : String(value ?? "")
                        }
                        onChange={(e) => set(f.key, e.target.value)}
                      />
                      {f.type === "images" && (
                        <select
                          aria-label="Añadir foto a la galería"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              const current = Array.isArray(stored)
                                ? stored
                                : String(stored || "")
                                    .split("\n")
                                    .filter(Boolean);
                              set(
                                f.key,
                                [
                                  ...new Set([...current, e.target.value]),
                                ].slice(0, 10),
                              );
                            }
                          }}
                        >
                          <option value="">
                            Añadir imagen de la biblioteca…
                          </option>
                          {images.map((i) => (
                            <option value={i.url} key={i.url}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  ) : (
                    <input
                      type={f.type === "money" ? "number" : f.type || "text"}
                      value={
                        f.type === "datetime-local" && value
                          ? String(value).slice(0, 16)
                          : String(value ?? "")
                      }
                      step={
                        f.type === "money"
                          ? "0.01"
                          : f.type === "number"
                            ? "1"
                            : undefined
                      }
                      min={
                        ["money", "number"].includes(f.type || "")
                          ? 0
                          : undefined
                      }
                      minLength={
                        f.type === "password" && value ? 12 : undefined
                      }
                      maxLength={
                        f.key === "slug"
                          ? 200
                          : f.type === "password"
                            ? 128
                            : 1000
                      }
                      onChange={(e) =>
                        set(
                          f.key,
                          f.type === "money"
                            ? e.target.value === ""
                              ? ""
                              : Number(e.target.value) * 100
                            : e.target.value,
                        )
                      }
                      required={
                        f.required || (f.key === "password" && !initial.id)
                      }
                      autoComplete={
                        f.type === "password" ? "new-password" : undefined
                      }
                    />
                  )}
                </label>
              )}
              {f.help && <p className="small muted field-help">{f.help}</p>}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          {success}
        </p>
      )}
      <div className="editor-actions">
        <button className="button" disabled={busy}>
          <Save size={17} />
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
        {section !== "configuracion" && (
          <button type="button" className="button outline" onClick={close}>
            Cancelar
          </button>
        )}
        {Boolean(initial.id) &&
          ["productos", "categorias", "paginas", "cupones"].includes(
            section,
          ) && (
            <button
              className="danger-button"
              type="button"
              disabled={busy}
              onClick={async () => {
                if (
                  !confirm(
                    section === "paginas"
                      ? "¿Retirar esta página de la web?"
                      : "¿Archivar este registro? Se conservará el historial.",
                  )
                )
                  return;
                setBusy(true);
                try {
                  await request(
                    `/api/admin/${c.resource}/${initial.id}`,
                    "DELETE",
                  );
                  router.push(`/admin/${section}`);
                  router.refresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Archivar
            </button>
          )}
      </div>
    </form>
  );
}
export function MediaUpload() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="media-upload"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setMessage("");
        try {
          await request("/api/admin/upload", "POST", new FormData(form));
          setMessage("Imagen optimizada y guardada.");
          form.reset();
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Subir imagen (JPG, PNG, WebP o AVIF · hasta 5 MB)
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
        />
      </label>
      <button className="button" disabled={busy}>
        <Upload size={17} />
        {busy ? "Optimizando…" : "Subir imagen"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function MediaCard({
  item,
}: {
  item: {
    id: string;
    url: string;
    name: string;
    alt: string;
    width: number;
    height: number;
    size: number;
  };
}) {
  const [message, setMessage] = useState("");
  return (
    <article className="media-card">
      <Image src={item.url} alt={item.alt} width={300} height={220} />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await request(
              `/api/admin/media/${item.id}`,
              "PATCH",
              Object.fromEntries(new FormData(e.currentTarget)),
            );
            setMessage("Guardado.");
          } catch (e) {
            setMessage((e as Error).message);
          }
        }}
      >
        <label>
          Título
          <input
            name="name"
            defaultValue={item.name}
            required
            maxLength={200}
          />
        </label>
        <label>
          Texto alternativo
          <input name="alt" defaultValue={item.alt} maxLength={300} />
        </label>
        <p className="small muted">
          {item.width} × {item.height} · {Math.round(item.size / 1024)} KB
        </p>
        <div className="actions">
          <button className="button small-button">Guardar</button>
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              await navigator.clipboard.writeText(item.url);
              setMessage("Ruta copiada.");
            }}
          >
            Copiar ruta
          </button>
        </div>
        {message && (
          <p role="status" className="small">
            {message}
          </p>
        )}
      </form>
    </article>
  );
}
export function OrderEditor({ order: o }: { order: Record<string, unknown> }) {
  const [status, setStatus] = useState(String(o.status));
  const [payment, setPayment] = useState(String(o.paymentStatus));
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const items = o.items as OrderLine[];
  return (
    <div className="admin-order">
      <div className="panel">
        <h2>Productos</h2>
        {items.map((i, n) => (
          <div className="admin-order-line" key={n}>
            <Image src={i.image} alt={i.name} width={70} height={70} />
            <div>
              <strong>{i.name}</strong>
              <p>
                {i.sku} · {i.finish} · {i.quantity} ud.
              </p>
              <small>
                {i.madeToOrder ? "Fabricación a pedido" : "Stock reservado"} ·{" "}
                {i.leadDays} días estimados
              </small>
            </div>
            <strong>{money(i.unitPrice * i.quantity)}</strong>
          </div>
        ))}
        <div className="total-row">
          <span>Subtotal</span>
          <span>{money(Number(o.subtotal))}</span>
        </div>
        <div className="total-row">
          <span>Envío</span>
          <span>{money(Number(o.shipping))}</span>
        </div>
        <div className="total-row">
          <span>Descuento {String(o.coupon || "")}</span>
          <span>−{money(Number(o.discount))}</span>
        </div>
        <div className="total-row grand">
          <span>Total</span>
          <strong>{money(Number(o.total))}</strong>
        </div>
        <h2>Cliente y entrega</h2>
        <p>
          {String(o.customerName)} · {String(o.email)} · {String(o.phone)}
        </p>
        <p>
          {String(o.address)} · {String(o.district)}
        </p>
        <p>
          {o.delivery === "PICKUP" ? "Recojo en tienda" : "Entrega a domicilio"}
        </p>
        <p>
          Pago preferido:{" "}
          {o.payment === "TRANSFER"
            ? "Transferencia"
            : o.payment === "YAPE"
              ? "Yape"
              : "Efectivo"}
        </p>
        {Boolean(o.notes) && <p>Indicaciones: {String(o.notes)}</p>}
        <h2>Historial</h2>
        <ol className="timeline">
          {(
            o.history as {
              status: string;
              at: string;
              actor: string;
              note: string;
            }[]
          ).map((h, i) => (
            <li key={i}>
              <strong>{statuses[h.status]}</strong>
              <small>
                {new Date(h.at).toLocaleString("es-PE", {
                  timeZone: "America/Lima",
                })}{" "}
                · {h.actor}
              </small>
              <p>{h.note}</p>
            </li>
          ))}
        </ol>
      </div>
      <form
        className="panel stack-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await request(`/api/admin/orders/${o.id}`, "PATCH", {
              status,
              paymentStatus: payment,
              note,
            });
            setNote("");
            setMessage("Pedido actualizado.");
            router.refresh();
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Gestionar pedido</h2>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {[String(o.status), ...(transitions[String(o.status)] || [])].map(
              (s) => (
                <option key={s} value={s}>
                  {statuses[s]}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          Pago
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado (comprobado)</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>
        </label>
        <label>
          Nota visible para el cliente
          <textarea
            rows={4}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <p className="small muted">
          Al cancelar, se repone una sola vez el stock reservado. Cambiar el
          estado no realiza cobros ni reembolsos bancarios.
        </p>
        <button className="button" disabled={busy}>
          {busy ? "Guardando…" : "Actualizar pedido"}
        </button>
        {message && <p role="status">{message}</p>}
        <button
          type="button"
          className="button outline"
          onClick={() => window.print()}
        >
          Imprimir resumen
        </button>
      </form>
    </div>
  );
}
