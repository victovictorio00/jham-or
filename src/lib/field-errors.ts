export const fieldLabels: Record<string, string> = {
  name: "Nombre",
  title: "Título",
  slug: "Enlace (slug)",
  sku: "Código interno / SKU",
  categoryId: "Categoría",
  description: "Descripción",
  price: "Precio",
  salePrice: "Precio de oferta",
  image: "Imagen principal",
  gallery: "Galería de imágenes",
  material: "Material",
  dimensions: "Medidas",
  finishes: "Acabados",
  leadDays: "Plazo estimado en días",
  stock: "Unidades en stock",
  position: "Orden",
  code: "Código",
  percent: "Descuento",
  minimum: "Compra mínima",
  email: "Correo electrónico",
  phone: "Teléfono",
  password: "Contraseña",
  role: "Permiso",
  brand: "Nombre de la marca",
  heroTitle: "Título de portada",
  heroText: "Descripción de portada",
  heroImage: "Fotografía de portada",
  deliveryArea: "Zona de cobertura",
  shippingFee: "Costo de envío",
  content: "Contenido",
  seoDescription: "Descripción para buscadores",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  address: "Dirección",
  district: "Distrito",
  currentPassword: "Contraseña actual",
};
export type ValidationIssue = {
  path?: PropertyKey[];
  code?: string;
  message?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  origin?: string;
  format?: string;
};
export function validationFields(issues: ValidationIssue[]) {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path?.[0] ?? "");
    if (!key || fields[key]) continue;
    const label = fieldLabels[key] || "Este campo";
    let message = `Revisa ${label.toLocaleLowerCase("es-PE")}.`;
    if (issue.code === "custom" && issue.message) message = issue.message;
    else if (key === "slug")
      message = "Usa minúsculas, números y guiones, sin espacios.";
    else if (issue.code === "too_small")
      message =
        issue.origin === "number"
          ? `${label}: el mínimo es ${String(issue.minimum)}.`
          : issue.minimum === 1
            ? `Completa ${label.toLowerCase()}.`
            : `${label}: escribe al menos ${String(issue.minimum)} caracteres.`;
    else if (issue.code === "too_big")
      message =
        issue.origin === "number"
          ? `${label}: el máximo es ${String(issue.maximum)}.`
          : `${label}: máximo ${String(issue.maximum)} ${issue.origin === "array" ? "elementos" : "caracteres"}.`;
    else if (key === "email")
      message = "Introduce un correo electrónico válido.";
    else if (key === "categoryId") message = "Selecciona una categoría.";
    else if (issue.code === "invalid_type")
      message = `Completa ${label.toLowerCase()} con un valor válido.`;
    fields[key] = message;
  }
  return fields;
}
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200)
    .replace(/-$/, "");
}
