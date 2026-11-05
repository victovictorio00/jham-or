import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
const db = new PrismaClient();
const origin = { Origin: "http://localhost:3012" };
const account = {
  name: "Cliente de prueba",
  email: "qa-" + randomUUID() + "@example.com",
  phone: "999111222",
  password: "PruebaJhamor12345!",
};
test.describe.configure({ mode: "serial" });
test.afterAll(async () => {
  await db.$disconnect();
});
test("public storefront and responsive pages render without overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of [
      "/",
      "/productos",
      "/productos/sofa-olivo",
      "/nosotros",
      "/contacto",
      "/auth/registro",
      "/carrito",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
    }
    if (width === 390) {
      await page.goto("/");
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .click();
      await expect(
        page.getByRole("navigation", { name: "Navegación principal" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("navigation", { name: "Navegación principal" }),
      ).toBeHidden();
    }
  }
  expect(errors).toEqual([]);
});
test("catalog filters, sorts and empty states work", async ({ page }) => {
  await page.goto("/productos?categoria=comedor");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("textbox", { name: "Buscar muebles" })
    .fill("no-existe-qa");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("No encontramos esa pieza.")).toBeVisible();
  await page.goto("/productos?orden=price-asc");
  await expect(page.locator(".product-card").first()).toContainText(
    "Silla Alba",
  );
});
test("cart persists and checkout requires authentication", async ({ page }) => {
  await page.goto("/productos/sofa-olivo");
  await page.getByRole("button", { name: "Añadir a la bolsa" }).click();
  await page.getByRole("link", { name: "Ver mi bolsa" }).click();
  await expect(page.locator(".cart-line")).toContainText("Sofá Olivo");
  await page.reload();
  await expect(page.locator(".cart-line")).toContainText("Sofá Olivo");
  await page.getByRole("link", { name: "Continuar con mi pedido" }).click();
  await expect(page).toHaveURL(/auth\/login\?next=/);
});
test("registration, purchase, account privacy and session protection", async ({
  page,
}) => {
  await page.goto("/auth/registro?next=/checkout");
  await page.getByLabel("Nombre completo", { exact: true }).fill(account.name);
  await page.getByLabel("Teléfono", { exact: true }).fill(account.phone);
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(account.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(account.password);
  await page
    .getByLabel("Repite la contraseña", { exact: true })
    .fill(account.password);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page).toHaveURL("/checkout");
  await page.goto("/productos/silla-alba");
  await page.getByRole("button", { name: "Añadir a la bolsa" }).click();
  await page.goto("/checkout");
  await page.getByLabel("Dirección completa").fill("Avenida Prueba 123");
  await page.getByLabel("Distrito", { exact: true }).fill("Miraflores");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar mi pedido" }).click();
  await expect(page).toHaveURL(/mi-cuenta\/pedidos\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Pedido JO-",
  );
  await expect(page.getByText("Silla Alba", { exact: true })).toBeVisible();
  const id = page.url().split("/").pop();
  const o = await db.order.findUniqueOrThrow({ where: { id } });
  expect(o.total).toBe(72900);
  expect(
    (await db.product.findUniqueOrThrow({ where: { slug: "silla-alba" } }))
      .stock,
  ).toBe(11);
  const forbidden = await page.request.patch("/api/admin/settings", {
    headers: origin,
    data: {},
  });
  expect(forbidden.status()).toBe(403);
  const cross = await page.request.post("/api/auth/logout", {
    headers: { Origin: "https://attacker.example" },
  });
  expect(cross.status()).toBe(403);
  await page.goto("/mi-cuenta");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.goto(`/mi-cuenta/pedidos/${id}`);
  await expect(page).toHaveURL(/auth\/login/);
});
test("parallel checkout cannot oversell, retries are idempotent and cancel restores stock once", async ({
  playwright,
}) => {
  const c = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  await c.post("/api/auth/login", { data: account });
  const cat = await db.category.findFirstOrThrow();
  const product = await db.product.create({
    data: {
      name: "QA Concurrencia",
      slug: "qa-" + randomUUID(),
      sku: "QA-" + randomUUID(),
      description: "test",
      price: 10000,
      categoryId: cat.id,
      image: "/images/chair.webp",
      material: "Madera",
      dimensions: "50x50",
      stock: 1,
    },
  });
  const body = (key: string) => ({
    name: account.name,
    phone: account.phone,
    address: "Prueba 123",
    district: "Lima",
    delivery: "DELIVERY",
    payment: "TRANSFER",
    notes: "",
    coupon: "",
    idempotencyKey: key,
    items: [{ productId: product.id, quantity: 1, finish: "" }],
  });
  const keys = [randomUUID(), randomUUID()];
  const responses = await Promise.all(
    keys.map((k) => c.post("/api/orders", { data: body(k) })),
  );
  expect(responses.map((r) => r.status()).sort()).toEqual([201, 409]);
  const winner = responses.findIndex((r) => r.status() === 201);
  const order = await responses[winner].json();
  const repeat = await c.post("/api/orders", { data: body(keys[winner]) });
  expect(repeat.status()).toBe(201);
  expect((await repeat.json()).id).toBe(order.id);
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock,
  ).toBe(0);
  const admin = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  expect(
    (
      await admin.post("/api/auth/login", {
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      })
    ).ok(),
  ).toBeTruthy();
  for (let i = 0; i < 2; i++) {
    const cancel = await admin.patch(`/api/admin/orders/${order.id}`, {
      data: { status: "CANCELLED", paymentStatus: "PENDING", note: "" },
    });
    expect(cancel.status()).toBe(200);
  }
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock,
  ).toBe(1);
  const invalid = await admin.patch(`/api/admin/orders/${order.id}`, {
    data: { status: "CONFIRMED", paymentStatus: "PENDING", note: "" },
  });
  expect(invalid.status()).toBe(409);
  await admin.dispose();
  await c.dispose();
});
test("admin edits publish immediately and unchanged saves do not add audit records", async ({
  page,
}) => {
  await page.goto("/auth/login?next=/admin");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(process.env.ADMIN_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/admin");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const section of [
      "",
      "productos",
      "categorias",
      "pedidos",
      "clientes",
      "equipo",
      "media",
      "paginas",
      "cupones",
      "configuracion",
      "historial",
    ]) {
      await page.goto("/admin" + (section ? "/" + section : ""));
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBeTruthy();
    }
  }
  await page.goto("/admin/productos?edit=new");
  await page.getByLabel("Nombre", { exact: true }).fill("Mueble QA publicado");
  await page.getByLabel("Enlace (slug)", { exact: true }).fill("qa-publicado");
  await page
    .getByLabel("Código interno / SKU", { exact: true })
    .fill("QA-PUBLICADO");
  const category = await db.category.findFirstOrThrow();
  await page.getByLabel("Categoría", { exact: true }).selectOption(category.id);
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Mueble de comprobación");
  await page.getByLabel("Precio (S/)", { exact: true }).fill("199.90");
  await page
    .getByLabel("Imagen principal", { exact: true })
    .selectOption("/images/chair.webp");
  await page.getByLabel("Material", { exact: true }).fill("Roble");
  await page
    .getByLabel("Medidas (ancho × fondo × alto)", { exact: true })
    .fill("50 × 60 × 80 cm");
  await page.getByLabel("Unidades en stock", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL("/admin/productos");
  await page.goto("/productos/qa-publicado");
  await expect(page.locator("h1")).toHaveText("Mueble QA publicado");
  await expect(page.locator(".detail-price")).toContainText("199.90");
  const p = await db.product.findUniqueOrThrow({
    where: { slug: "qa-publicado" },
  });
  expect(p.price).toBe(19990);
  const before = await db.audit.count();
  await page.goto(`/admin/productos?edit=${p.id}`);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("No hay cambios nuevos.")).toBeVisible();
  expect(await db.audit.count()).toBe(before);
  await page.screenshot({ path: "docs/admin-desktop.png", fullPage: true });
  await page.goto("/");
  await page.screenshot({ path: "docs/home-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/home-mobile.png", fullPage: true });
});

test("private order isolation, coupons, manufactured furniture and image uploads", async ({
  playwright,
}) => {
  const admin = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  expect(
    (
      await admin.post("/api/auth/login", {
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      })
    ).ok(),
  ).toBeTruthy();
  const customer = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  const other = { ...account, email: "other-" + randomUUID() + "@example.com" };
  expect(
    (await customer.post("/api/auth/register", { data: other })).status(),
  ).toBe(201);
  const oldOrder = await db.order.findFirstOrThrow({
    where: { email: {not: other.email} },
  });
  expect(
    (await customer.get(`/mi-cuenta/pedidos/${oldOrder.id}`)).status(),
  ).toBe(404);
  const coupon = "QA" + Date.now();
  expect(
    (
      await admin.post("/api/admin/coupons", {
        data: {
          code: coupon,
          percent: 10,
          minimum: 0,
          active: true,
          expiresAt: null,
        },
      })
    ).status(),
  ).toBe(200);
  const bed = await db.product.findUniqueOrThrow({
    where: { slug: "cama-serena" },
  });
  const items = [{ productId: bed.id, quantity: 1, finish: bed.finishes[0] }];
  const quote = await customer.post("/api/quote", { data: { items, coupon } });
  expect(quote.status()).toBe(200);
  expect((await quote.json()).discount).toBe(32900);
  const purchase = await customer.post("/api/orders", {
    data: {
      name: other.name,
      phone: other.phone,
      address: "Avenida Muestra 123",
      district: "Lima",
      delivery: "DELIVERY",
      payment: "TRANSFER",
      coupon,
      notes: "Prueba a pedido",
      idempotencyKey: randomUUID(),
      items,
    },
  });
  expect(purchase.status()).toBe(201);
  expect((await purchase.json()).total).toBe(304100);
  expect(
    (await db.product.findUniqueOrThrow({ where: { id: bed.id } })).stock,
  ).toBe(0);
  const badFinish = await customer.post("/api/orders", {
    data: {
      name: other.name,
      phone: other.phone,
      address: "Avenida Muestra 123",
      district: "Lima",
      delivery: "DELIVERY",
      payment: "TRANSFER",
      coupon: "",
      notes: "",
      idempotencyKey: randomUUID(),
      items: [{ ...items[0], finish: "Acabado inventado" }],
    },
  });
  expect(badFinish.status()).toBe(400);
  const upload = await admin.post("/api/admin/upload", {
    multipart: {
      file: {
        name: "qa-pixel.png",
        mimeType: "image/png",
        buffer: await sharp({create:{width:2,height:2,channels:3,background:"#ffffff"}}).png().toBuffer(),
      },
    },
  });
  expect(upload.status()).toBe(201);
  const media = await upload.json();
  expect(media.url).toMatch(/^\/media\/.*\.webp$/);
  const image = await customer.get(media.url);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/webp");
  const exported = await admin.get("/api/admin/export");
  expect(exported.status()).toBe(200);
  expect(exported.headers()["content-type"]).toContain("text/csv");
  await admin.dispose();
  await customer.dispose();
});
