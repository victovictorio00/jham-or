import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
const db = new PrismaClient();
const origin = { Origin: "http://localhost:3012" };
test.afterAll(async () => db.$disconnect());
async function adminContext(playwright: any) {
  const context = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  expect(
    (
      await context.post("/api/auth/login", {
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      })
    ).status(),
  ).toBe(200);
  return context;
}
async function upload(
  context: any,
  name = "qa-media-" + randomUUID() + ".png",
) {
  const response = await context.post("/api/admin/upload", {
    multipart: {
      file: {
        name,
        mimeType: "image/png",
        buffer: await sharp({
          create: {
            width: 1600,
            height: 1000,
            channels: 3,
            background: "#9b7354",
          },
        })
          .png()
          .toBuffer(),
      },
    },
  });
  expect(response.status()).toBe(201);
  return { ...(await response.json()), name };
}

test("sidebar collapses, keeps icon navigation, persists and works on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  await expect(
    page.getByText("Tu negocio, en orden.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".admin-header")).toHaveCount(0);
  await page.getByRole("button", { name: "Contraer menú lateral" }).click();
  await expect(
    page.getByRole("button", { name: "Expandir menú lateral" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".admin-sidebar")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(80);
  await page.getByRole("link", { name: "Muebles", exact: true }).click();
  await expect(page).toHaveURL("/admin/productos");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expandir menú lateral" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".admin-sidebar")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(80);
  for (const [label, url] of [
    ["Imágenes", "media"],
    ["Diseño y tienda", "configuracion"],
    ["Resumen", ""],
  ] as const) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL("/admin" + (url ? "/" + url : ""));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
  await page.screenshot({ path: "docs/admin-collapsed.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Muebles", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".sidebar-label").filter({ hasText: "Muebles" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Muebles", exact: true }).click();
  await expect(page.locator(".admin-sidebar")).not.toHaveClass(/open/);
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".admin-sidebar")).not.toHaveClass(/open/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Expandir menú lateral" }).click();
  expect(
    await page
      .locator(".admin-sidebar")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThan(200);
});

test("cover preview uses a thumbnail without API calls and refresh keeps unsaved text", async ({
  page,
  playwright,
}) => {
  const admin = await adminContext(playwright);
  const image = await upload(admin);
  expect(image.thumbnailUrl).toMatch(/-thumb\.webp$/);
  const thumbnail = await admin.get(image.thumbnailUrl);
  expect(thumbnail.status()).toBe(200);
  expect(
    (await sharp(await thumbnail.body()).metadata()).width,
  ).toBeLessThanOrEqual(360);
  await page.goto("/auth/login?next=/admin/configuracion");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(process.env.ADMIN_EMAIL!);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/admin/configuracion");
  const title = page.getByLabel("Título de portada", { exact: true });
  const oldTitle = await title.inputValue();
  const select = page.getByLabel("Fotografía de portada", { exact: true });
  const previous = await select.inputValue();
  let apiCalls = 0,
    rscCalls = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls++;
    if (request.headers()["rsc"] === "1") rscCalls++;
  });
  await select.selectOption(image.url);
  const preview = page.getByAltText("Imagen seleccionada", { exact: true });
  await expect(preview).toHaveAttribute("src", image.thumbnailUrl);
  await expect
    .poll(() =>
      preview.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBeTruthy();
  expect(apiCalls).toBe(0);
  expect(rscCalls).toBe(0);
  await title.fill("Texto sin guardar de prueba");
  await page
    .getByRole("button", { name: "Actualizar biblioteca", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Actualizar biblioteca", exact: true }),
  ).toBeEnabled();
  expect(apiCalls).toBe(1);
  expect(rscCalls).toBe(0);
  await expect(title).toHaveValue("Texto sin guardar de prueba");
  await title.fill(oldTitle);
  await select.selectOption(previous);
  await page.goto("/admin/media");
  page.on("dialog", (dialog) => dialog.accept());
  const card = page.getByRole("article", { name: image.name, exact: true });
  await card
    .getByRole("button", { name: "Eliminar imagen " + image.name })
    .click();
  await expect(card).toHaveCount(0);
  await expect
    .poll(async () => (await admin.get(image.url)).status())
    .toBe(404);
  expect((await admin.get(image.thumbnailUrl)).status()).toBe(404);
  expect(await db.media.findUnique({ where: { id: image.id } })).toBeNull();
  expect(
    await db.audit.count({
      where: { entity: "media", entityId: image.id, action: "DELETE" },
    }),
  ).toBe(1);
  await page.screenshot({ path: "docs/admin-media.png", fullPage: true });
  await admin.dispose();
});

test("deletion protects used images and rejects a removed image in a stale editor", async ({
  playwright,
}) => {
  const admin = await adminContext(playwright);
  const original = await db.setting.findUniqueOrThrow({
    where: { key: "store" },
  });
  const image = await upload(admin);
  const changed = { ...(original.value as object), heroImage: image.url };
  expect(
    (await admin.put("/api/admin/settings", { data: changed })).status(),
  ).toBe(200);
  const denied = await admin.delete("/api/admin/media/" + image.id);
  expect(denied.status()).toBe(409);
  expect((await denied.json()).error).toContain("en uso");
  expect((await admin.get(image.url)).status()).toBe(200);
  expect(
    (await admin.put("/api/admin/settings", { data: original.value })).status(),
  ).toBe(200);
  await expect
    .poll(async () =>
      (await admin.delete("/api/admin/media/" + image.id)).status(),
    )
    .toBe(200);
  expect(
    (await admin.put("/api/admin/settings", { data: changed })).status(),
  ).toBe(409);
  const category = await db.category.findFirstOrThrow();
  const slug = "qa-deleted-" + randomUUID();
  const invalid = await admin.post("/api/admin/products", {
    data: {
      name: "Imagen retirada",
      slug,
      sku: slug,
      description: "Prueba",
      price: 10000,
      salePrice: null,
      categoryId: category.id,
      image: image.url,
      gallery: [],
      material: "Madera",
      dimensions: "50 × 50",
      finishes: [],
      leadDays: 7,
      stock: 1,
      madeToOrder: false,
      featured: false,
      active: true,
    },
  });
  expect(invalid.status()).toBe(409);
  expect(await db.product.findUnique({ where: { slug } })).toBeNull();
  const guest = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  expect((await guest.delete("/api/admin/media/" + image.id)).status()).toBe(
    401,
  );
  await guest.dispose();
  await admin.dispose();
});

test("assigning and deleting concurrently cannot publish a missing image", async ({
  playwright,
}) => {
  const admin = await adminContext(playwright);
  const original = await db.setting.findUniqueOrThrow({
    where: { key: "store" },
  });
  const image = await upload(admin);
  const [assign, remove] = await Promise.all([
    admin.put("/api/admin/settings", {
      data: { ...(original.value as object), heroImage: image.url },
    }),
    admin.delete("/api/admin/media/" + image.id),
  ]);
  expect([assign.status(), remove.status()].sort()).toEqual([200, 409]);
  const current = await db.setting.findUniqueOrThrow({
    where: { key: "store" },
  });
  if ((current.value as { heroImage: string }).heroImage === image.url)
    expect((await admin.get(image.url)).status()).toBe(200);
  expect(
    (await admin.put("/api/admin/settings", { data: original.value })).status(),
  ).toBe(200);
  if (await db.media.findUnique({ where: { id: image.id } }))
    await expect
      .poll(async () =>
        (await admin.delete("/api/admin/media/" + image.id)).status(),
      )
      .toBe(200);
  await admin.dispose();
});

test("product galleries and historical orders keep their images protected", async ({
  playwright,
}) => {
  const admin = await adminContext(playwright);
  const image = await upload(admin);
  const gallery = await upload(admin);
  const category = await db.category.findFirstOrThrow();
  const slug = "qa-history-" + randomUUID();
  const data = {
    name: "Mueble con imagen histórica",
    slug,
    sku: slug,
    description: "Prueba de referencias",
    price: 10000,
    salePrice: null,
    categoryId: category.id,
    image: image.url,
    gallery: [gallery.url],
    material: "Roble",
    dimensions: "50 × 50 × 80",
    finishes: [],
    leadDays: 7,
    stock: 0,
    madeToOrder: true,
    featured: false,
    active: true,
  };
  expect((await admin.post("/api/admin/products", { data })).status()).toBe(
    200,
  );
  const product = await db.product.findUniqueOrThrow({ where: { slug } });
  expect((await admin.delete("/api/admin/media/" + gallery.id)).status()).toBe(
    409,
  );
  const customer = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: origin,
  });
  const account = {
    name: "Prueba histórica",
    email: "qa-history-" + randomUUID() + "@example.com",
    phone: "999111222",
    password: "PruebaHistorica123!",
  };
  expect(
    (await customer.post("/api/auth/register", { data: account })).status(),
  ).toBe(201);
  const order = await customer.post("/api/orders", {
    data: {
      idempotencyKey: randomUUID(),
      items: [{ productId: product.id, quantity: 1, finish: "" }],
      name: account.name,
      phone: account.phone,
      address: "Avenida Prueba 123",
      district: "Lima",
      delivery: "DELIVERY",
      payment: "TRANSFER",
      notes: "",
      coupon: "",
    },
  });
  expect(order.status()).toBe(201);
  expect(
    (
      await admin.patch("/api/admin/products/" + product.id, {
        data: {
          ...data,
          image: "/images/chair.webp",
          gallery: [],
          active: false,
        },
      })
    ).status(),
  ).toBe(200);
  expect((await admin.delete("/api/admin/media/" + image.id)).status()).toBe(
    409,
  );
  expect((await admin.get(image.url)).status()).toBe(200);
  await expect
    .poll(async () =>
      (await admin.delete("/api/admin/media/" + gallery.id)).status(),
    )
    .toBe(200);
  await customer.dispose();
  await admin.dispose();
});
