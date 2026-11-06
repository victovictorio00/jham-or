"use client";
import { VariantEditor } from "./variant-editor";
import type { ProductVariant } from "@/lib/shared";
import { ImageListEditor } from "./image-list-editor";
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
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { request, Logout, RequestError } from "./forms";
import { Select } from "./select";
import { RequiredMark, RequiredNote } from "./fields";
import { slugify } from "@/lib/field-errors";
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
  initialCollapsed = false,
}: {
  name: string;
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `jhamor_admin_sidebar=${next ? "compact" : "expanded"}; Path=/admin; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  };
  return (
    <div className={`admin-shell${collapsed ? " is-collapsed" : ""}`}>
      {open && (
        <button
          className="admin-menu-overlay"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`admin-sidebar${open ? " open" : ""}`}>
        <div className="admin-sidebar-top">
          <Link
            prefetch={false}
            href="/admin"
            className="wordmark"
            aria-label="Jham-or, resumen"
          >
            <span className="sidebar-brand-full">
              JHAM-OR<small>ADMINISTRACIÓN</small>
            </span>
            <span className="sidebar-brand-mark" aria-hidden="true">
              J
            </span>
          </Link>
          <button
            className="icon-button sidebar-toggle"
            type="button"
            aria-label={
              collapsed ? "Expandir menú lateral" : "Contraer menú lateral"
            }
            title={
              collapsed ? "Expandir menú lateral" : "Contraer menú lateral"
            }
            aria-expanded={!collapsed}
            aria-controls="admin-navigation"
            onClick={toggle}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
        </div>
        <button
          className="icon-button close-sidebar"
          aria-label="Cerrar menú lateral"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <nav id="admin-navigation" aria-label="Administración">
          {nav.map(([slug, label, Icon]) => (
            <Link
              prefetch={false}
              href={`/admin${slug ? "/" + slug : ""}`}
              key={slug}
              onClick={() => setOpen(false)}
              className={
                path === `/admin${slug ? "/" + slug : ""}` ? "active" : ""
              }
              aria-label={label}
              title={label}
            >
              <Icon size={19} />
              <span className="sidebar-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link
            prefetch={false}
            href="/"
            target="_blank"
            className="view-store"
            aria-label="Ver mi tienda"
            title="Ver mi tienda"
          >
            <ExternalLink size={18} />
            <span>Ver mi tienda</span>
          </Link>
          <button
            type="button"
            className="view-store"
            title="Actualizar datos"
            aria-label="Actualizar datos"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              setRefreshError("");
              try {
                await request("/api/admin/refresh", "POST", {
                  section: path.split("/")[2] || "overview",
                });
                router.refresh();
              } catch (error) {
                setRefreshError((error as Error).message);
              } finally {
                setRefreshing(false);
              }
            }}
          >
            <RefreshCw size={18} />
            <span>{refreshing ? "Actualizando…" : "Actualizar datos"}</span>
          </button>
          {refreshError && (
            <p role="alert" className="small">
              {refreshError}
            </p>
          )}
          <p className="small sidebar-user">{name}</p>
          <Logout icon />
        </div>
      </aside>
      <div className="admin-body">
        <div className="admin-mobile-toolbar">
          <button
            className="icon-button"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="admin-navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
        </div>
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
      { key: "variants", label: "Variantes del producto", type: "variants" },
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
        key: "heroImages",
        label: "Carrusel de portada",
        type: "carousel",
        required: true,
        help: "Añade hasta 8 imágenes y ordénalas. El carrusel muestra únicamente las fotografías.",
      },
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
  images?: { url: string; name: string; thumbnailUrl?: string | null }[];
}) {
  const router = useRouter();
  const c = config[section];
  const [values, setValues] = useState<Record<string, unknown>>({ ...initial });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const manualSlug = useRef(Boolean(initial.slug));
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageChoices, setImageChoices] = useState(images);
  const [refreshingImages, setRefreshingImages] = useState(false);
  useEffect(() => setImageChoices(images), [images]);
  const refreshImages = async () => {
    setRefreshingImages(true);
    try {
      const result = await request("/api/admin/media-options", "GET");
      setImageChoices(result.items);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setRefreshingImages(false);
    }
  };
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
    if (key === "slug") manualSlug.current = Boolean(value);
    setValues((v) => ({
      ...v,
      [key]: value,
      ...(!initial.id &&
      !manualSlug.current &&
      ["name", "title"].includes(key) &&
      c.fields.some((field) => field.key === "slug")
        ? { slug: slugify(String(value)) }
        : {}),
    }));
    setError("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (!initial.id && !manualSlug.current && ["name", "title"].includes(key))
        delete next.slug;
      if (key === "price") delete next.salePrice;
      return next;
    });
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
    setFieldErrors({});
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
        else if (field.type === "variants")
          body[field.key] = Array.isArray(body[field.key])
            ? body[field.key]
            : [];
        else if (
          field.type === "lines" ||
          field.type === "images" ||
          field.type === "carousel"
        )
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
      if (section === "configuracion") router.refresh();
    } catch (e) {
      const fields = e instanceof RequestError ? e.fieldErrors : {};
      setFieldErrors(fields);
      setError(
        Object.keys(fields).length
          ? "Revisa los campos señalados. Tus datos se han conservado."
          : (e as Error).message,
      );
      requestAnimationFrame(() => {
        const key = Object.keys(fields)[0];
        if (key) {
          const control = formRef.current?.elements.namedItem(
            key,
          ) as HTMLInputElement | null;
          if (!control || !("focus" in control))
            formRef.current
              ?.querySelector<HTMLElement>(
                `[data-field="${key}"] input,[data-field="${key}"] button`,
              )
              ?.focus();
          else if (control?.tagName === "SELECT")
            control.parentElement
              ?.querySelector<HTMLButtonElement>('[role="combobox"]')
              ?.focus();
          else control?.focus();
        }
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="editor-form"
      onSubmit={save}
      ref={formRef}
      onInvalidCapture={(event) => {
        const target = event.target as HTMLInputElement;
        if (target.name) {
          const fieldKey = target.name.startsWith("variant-")
            ? "variants"
            : target.name;
          const label =
            c.fields.find((field) => field.key === target.name)?.label ||
            "este campo";
          setFieldErrors((current) => ({
            ...current,
            [fieldKey]: target.validity.valueMissing
              ? `Completa ${label.toLowerCase()}.`
              : target.validity.rangeUnderflow
                ? `${label}: el mínimo es ${target.min}.`
                : target.validity.rangeOverflow
                  ? `${label}: el máximo es ${target.max}.`
                  : target.validity.tooShort
                    ? `${label}: escribe al menos ${target.minLength} caracteres.`
                    : target.validity.typeMismatch && target.type === "email"
                      ? "Introduce un correo electrónico válido."
                      : `Revisa ${label.toLowerCase()}.`,
          }));
          setError("Completa o corrige los campos señalados antes de guardar.");
        }
      }}
    >
      <RequiredNote />
      {c.fields.some((field) =>
        ["image", "images", "carousel", "variants"].includes(field.type || ""),
      ) && (
        <div className="editor-library-actions">
          <span>Biblioteca de imágenes</span>
          <Link
            prefetch={false}
            href="/admin/media"
            target="_blank"
            className="text-link small"
          >
            Subir imágenes en otra pestaña
          </Link>
          <button
            type="button"
            className="button outline small-button"
            onClick={refreshImages}
            disabled={refreshingImages}
          >
            {refreshingImages ? "Actualizando…" : "Actualizar biblioteca"}
          </button>
        </div>
      )}
      <div className="editor-fields">
        {c.fields.map((f) => {
          if (
            section === "productos" &&
            Array.isArray(values.variants) &&
            values.variants.length &&
            [
              "price",
              "salePrice",
              "stock",
              "finishes",
              "madeToOrder",
              "image",
              "gallery",
            ].includes(f.key)
          )
            return null;
          let value = values[f.key];
          if (f.type === "money" && typeof value === "number")
            value = value / 100;
          const options =
            f.key === "categoryId"
              ? categories.map((c) => ({ value: c.id, label: c.name }))
              : f.options;
          const FieldLabel = ["variants", "carousel"].includes(f.type || "")
            ? "div"
            : "label";
          const stored = values[f.key];
          const required = Boolean(
            f.required ||
              (f.key === "password" && !initial.id) ||
              f.key === "role",
          );
          const label =
            f.key === "password"
              ? initial.id
                ? "Nueva contraseña (opcional, mínimo 12 caracteres)"
                : "Contraseña inicial (mínimo 12 caracteres)"
              : f.label;
          const accessibility = {
            name: f.key,
            "aria-label": label,
            "aria-invalid": Boolean(fieldErrors[f.key]) || undefined,
            "aria-describedby": fieldErrors[f.key]
              ? `error-${f.key}`
              : undefined,
          };
          return (
            <div
              key={f.key}
              data-field={f.key}
              className={
                [
                  "textarea",
                  "image",
                  "images",
                  "carousel",
                  "variants",
                ].includes(f.type || "")
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
                <FieldLabel className="field-label">
                  <span className="field-caption">
                    {label}
                    {required && <RequiredMark />}
                  </span>
                  {f.type === "variants" ? (
                    <VariantEditor
                      value={
                        Array.isArray(stored)
                          ? (stored as ProductVariant[])
                          : []
                      }
                      choices={imageChoices}
                      onChange={(variants) => set(f.key, variants)}
                    />
                  ) : f.type === "carousel" ? (
                    <ImageListEditor
                      label={label}
                      name={f.key}
                      value={Array.isArray(stored) ? (stored as string[]) : []}
                      choices={imageChoices}
                      max={8}
                      required
                      onChange={(images) => set(f.key, images)}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={f.key === "content" ? 16 : 5}
                      {...accessibility}
                      value={String(value ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      required={required}
                      maxLength={
                        f.key === "content"
                          ? 30000
                          : f.key === "heroTitle"
                            ? 200
                            : f.key === "heroText" || section === "categorias"
                              ? 1000
                              : 10000
                      }
                    />
                  ) : f.type === "select" ? (
                    <Select
                      {...accessibility}
                      value={String(value ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      required={required}
                    >
                      <option value="">Selecciona una opción</option>
                      {options?.map((o) => (
                        <option value={o.value} key={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : f.type === "image" ? (
                    <div className="image-picker">
                      {Boolean(value) && (
                        <Image
                          src={
                            imageChoices.find((image) => image.url === value)
                              ?.thumbnailUrl || String(value)
                          }
                          alt="Imagen seleccionada"
                          width={100}
                          height={80}
                          unoptimized={Boolean(
                            imageChoices.find((image) => image.url === value)
                              ?.thumbnailUrl,
                          )}
                          sizes="100px"
                          loading="eager"
                        />
                      )}
                      <Select
                        {...accessibility}
                        value={String(value ?? "")}
                        onChange={(e) => set(f.key, e.target.value)}
                        required={required}
                      >
                        <option value="">Sin imagen</option>
                        {[
                          ...new Map(
                            [
                              ...imageChoices,
                              ...(value &&
                              !imageChoices.some((image) => image.url === value)
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
                          <option
                            key={i.url}
                            value={i.url}
                            data-thumbnail={
                              i.thumbnailUrl ||
                              `/_next/image?url=${encodeURIComponent(i.url)}&w=64&q=75`
                            }
                          >
                            {i.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : f.type === "lines" || f.type === "images" ? (
                    <>
                      <textarea
                        rows={4}
                        {...accessibility}
                        value={
                          Array.isArray(value)
                            ? value.join("\n")
                            : String(value ?? "")
                        }
                        onChange={(e) => set(f.key, e.target.value)}
                      />
                      {f.type === "images" && (
                        <Select
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
                          {imageChoices.map((i) => (
                            <option
                              value={i.url}
                              key={i.url}
                              data-thumbnail={
                                i.thumbnailUrl ||
                                `/_next/image?url=${encodeURIComponent(i.url)}&w=64&q=75`
                              }
                            >
                              {i.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </>
                  ) : (
                    <input
                      {...accessibility}
                      onBlur={
                        f.key === "slug"
                          ? () => {
                              if (values.slug)
                                set("slug", slugify(String(values.slug)));
                            }
                          : undefined
                      }
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
                          ? ["price", "salePrice"].includes(f.key)
                            ? 0.01
                            : f.key === "percent"
                              ? 1
                              : 0
                          : undefined
                      }
                      max={
                        f.key === "percent"
                          ? 80
                          : f.key === "leadDays"
                            ? 365
                            : f.key === "stock"
                              ? 100000
                              : f.key === "position"
                                ? 1000
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
                            : f.key === "phone"
                              ? 30
                              : f.key === "email"
                                ? 254
                                : ["address", "hours", "footer"].includes(f.key)
                                  ? 300
                                  : 200
                      }
                      onChange={(e) =>
                        set(
                          f.key,
                          f.type === "money"
                            ? e.target.value === ""
                              ? ""
                              : Math.round(Number(e.target.value) * 100)
                            : e.target.value,
                        )
                      }
                      required={required}
                      autoComplete={
                        f.type === "password" ? "new-password" : undefined
                      }
                    />
                  )}
                </FieldLabel>
              )}
              {fieldErrors[f.key] && (
                <p className="field-error" id={`error-${f.key}`}>
                  {fieldErrors[f.key]}
                </p>
              )}
              {f.key === "slug" && (
                <p className="small muted field-help">
                  Se genera a partir del nombre; puedes personalizarlo. Usa
                  minúsculas, números y guiones.
                </p>
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
export function MediaCard({
  item,
}: {
  item: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
    name: string;
    alt: string;
    width: number;
    height: number;
    size: number;
  };
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const router = useRouter();
  if (removed) return null;
  return (
    <article className="media-card" aria-label={item.name}>
      <Image
        src={item.thumbnailUrl || item.url}
        alt={item.alt}
        width={300}
        height={220}
        sizes="(max-width:600px) 90vw, 300px"
        unoptimized={Boolean(item.thumbnailUrl)}
      />
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await request(
              `/api/admin/media/${item.id}`,
              "PATCH",
              Object.fromEntries(new FormData(event.currentTarget)),
            );
            setMessage("Guardado.");
          } catch (error) {
            setMessage((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Título
          <RequiredMark />
          <input
            name="name"
            aria-label="Título"
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
          <button className="button small-button" disabled={busy}>
            Guardar
          </button>
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(item.url);
                setMessage("Ruta copiada.");
              } catch {
                setMessage("No se pudo copiar la ruta.");
              }
            }}
          >
            Copiar ruta
          </button>
          <button
            type="button"
            className="text-button media-delete"
            disabled={busy}
            aria-label={`Eliminar imagen ${item.name}`}
            onClick={async () => {
              if (
                !confirm(
                  "¿Eliminar esta imagen de la biblioteca y del servidor? Las imágenes en uso deben reemplazarse antes.",
                )
              )
                return;
              setBusy(true);
              try {
                const result = await request(
                  `/api/admin/media/${item.id}`,
                  "DELETE",
                );
                if (!result.fileRemoved) {
                  setMessage(
                    "La imagen se retiró de la biblioteca; no se pudo eliminar alguno de sus archivos.",
                  );
                  router.refresh();
                } else {
                  setRemoved(true);
                  router.refresh();
                }
              } catch (error) {
                setMessage((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Trash2 size={15} />
            Eliminar
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
          <RequiredMark />
          <Select
            aria-label="Estado"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[String(o.status), ...(transitions[String(o.status)] || [])].map(
              (s) => (
                <option key={s} value={s}>
                  {statuses[s]}
                </option>
              ),
            )}
          </Select>
        </label>
        <label>
          Pago
          <RequiredMark />
          <Select
            aria-label="Pago"
            required
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
          >
            <option value="PENDING">Pendiente</option>
            <option value="PAID">Pagado (comprobado)</option>
            <option value="REFUNDED">Reembolsado</option>
          </Select>
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
