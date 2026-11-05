import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { defaultSettings } from "../src/lib/shared";
const db = new PrismaClient();
async function main() {
  await db.setting.upsert({
    where: { key: "store" },
    update: {},
    create: { key: "store", value: defaultSettings },
  });
  for (const [name, slug, image, position] of [
    ["Sala", "sala", "hero", 0],
    ["Comedor", "comedor", "dining", 1],
    ["Dormitorio", "dormitorio", "bed", 2],
  ] as const)
    await db.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, image: `/images/${image}.webp`, position },
    });
  const items = [
    {
      name: "Sofá Olivo",
      slug: "sofa-olivo",
      sku: "JO-SAL-001",
      category: "sala",
      image: "sofa",
      price: 289000,
      material: "Tapizado textil y madera",
      dimensions: "210 × 85 × 80 cm",
      finishes: ["Verde olivo", "Arena"],
      stock: 5,
      featured: true,
      leadDays: 7,
    },
    {
      name: "Silla Alba",
      slug: "silla-alba",
      sku: "JO-COM-001",
      category: "comedor",
      image: "chair",
      price: 64900,
      material: "Madera y tapizado",
      dimensions: "52 × 55 × 78 cm",
      finishes: ["Natural", "Nogal"],
      stock: 12,
      featured: true,
      leadDays: 5,
    },
    {
      name: "Mesa de comedor Origen",
      slug: "mesa-comedor-origen",
      sku: "JO-COM-002",
      category: "comedor",
      image: "dining",
      price: 249000,
      material: "Madera de acabado natural",
      dimensions: "180 × 90 × 75 cm",
      finishes: ["Roble natural", "Nogal"],
      stock: 3,
      featured: true,
      leadDays: 14,
    },
    {
      name: "Cama Serena",
      slug: "cama-serena",
      sku: "JO-DOR-001",
      category: "dormitorio",
      image: "bed",
      price: 329000,
      material: "Madera y tapizado de lino",
      dimensions: "170 × 210 × 110 cm",
      finishes: ["Lino arena", "Lino piedra"],
      stock: 0,
      madeToOrder: true,
      featured: true,
      leadDays: 21,
    },
    {
      name: "Escritorio Línea",
      slug: "escritorio-linea",
      sku: "JO-DOR-002",
      category: "dormitorio",
      image: "table",
      price: 119000,
      material: "Madera y estructura metálica",
      dimensions: "120 × 60 × 75 cm",
      finishes: ["Natural"],
      stock: 6,
      featured: true,
      leadDays: 7,
    },
    {
      name: "Estantería Nido",
      slug: "estanteria-nido",
      sku: "JO-SAL-002",
      category: "sala",
      image: "shelf",
      price: 159000,
      material: "Madera de acabado cálido",
      dimensions: "100 × 35 × 180 cm",
      finishes: ["Roble", "Nogal"],
      stock: 4,
      featured: true,
      leadDays: 10,
    },
  ];
  for (const p of items) {
    const { category, image, ...data } = p;
    const c = await db.category.findUniqueOrThrow({
      where: { slug: category },
    });
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        categoryId: c.id,
        image: `/images/${image}.webp`,
        description: `${p.name} aporta calidez y equilibrio a tu espacio. Su diseño combina líneas serenas y materiales de carácter para acompañarte en los momentos de cada día.\n\nProducto de muestra: las fotografías, materiales, medidas y precios son referenciales. Reemplazar por la ficha comercial definitiva antes de abrir ventas.`,
        madeToOrder: "madeToOrder" in p ? p.madeToOrder : false,
      },
    });
  }
  const pages = [
    [
      "Términos de compra",
      "terminos",
      "Las compras requieren una cuenta. Los precios se expresan en soles (PEN).\n\nLos pedidos quedan pendientes de confirmación. El registro de un pedido no acredita un pago. El equipo coordinará la entrega y las instrucciones de pago.\n\nLos plazos de fabricación y entrega son estimados. Consulta disponibilidad, acabados y cobertura antes de confirmar.\n\nContenido inicial pendiente de completar con la razón social, RUC, garantías y condiciones comerciales definitivas de Jham-or.",
    ],
    [
      "Privacidad",
      "privacidad",
      "Utilizamos los datos de tu cuenta y de tus pedidos para gestionar tu compra, coordinar la entrega y atenderte.\n\nTu contraseña se almacena mediante un hash. La sesión utiliza una cookie necesaria para autenticarte; la bolsa se conserva en tu navegador.\n\nContenido inicial pendiente de completar con la identidad del responsable, contacto para derechos de datos, conservación y demás información aplicable antes de la apertura.",
    ],
    [
      "Envíos y devoluciones",
      "envios",
      "El envío inicial está configurado para Lima Metropolitana. El costo se muestra al finalizar el pedido.\n\nLos muebles de fabricación a pedido indican un plazo estimado en su ficha. Coordinaremos la fecha de entrega contigo.\n\nConserva el resumen de tu pedido y contáctanos si necesitas asistencia.\n\nContenido inicial pendiente de completar con las condiciones reales de entrega, cambios, devoluciones y garantías.",
    ],
  ];
  for (const [title, slug, content] of pages)
    await db.page.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        content,
        published: true,
        seoDescription: title + " de Jham-or.",
      },
    });
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    await db.user.upsert({
      where: { email },
      update: {},
      create: {
        name: "Administración Jham-or",
        email,
        role: "OWNER",
        passwordHash: await hash(process.env.ADMIN_PASSWORD, 12),
      },
    });
  }
  console.log("Catálogo de muestra y configuración preparados.");
}
main().finally(() => db.$disconnect());
