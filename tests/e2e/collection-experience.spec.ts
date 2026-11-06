import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { chooseOption } from "../helpers/select";
const db = new PrismaClient();
const origin = { Origin: "http://localhost:3012" };
test.use({ reducedMotion: "reduce" });
test.afterAll(() => db.$disconnect());
test("carousel, category quick access, independent variants and spacious account work together", async ({
  page,
  context,
  playwright,
}) => {
  test.setTimeout(120000);
  const suffix = randomUUID().slice(0, 8);
  const owner = await db.user.findUniqueOrThrow({
    where: { email: process.env.ADMIN_EMAIL },
  });
  const token = randomUUID(),
    tokenHash = createHash("sha256").update(token).digest("hex");
  await db.session.create({
    data: {
      userId: owner.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 300000),
    },
  });
  await context.addCookies([
    { name: "jhamor_session", value: token, url: "http://localhost:3012" },
  ]);
  const admin = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: { ...origin, Cookie: "jhamor_session=" + token },
  });
  const original = await db.setting.findUniqueOrThrow({
    where: { key: "store" },
  });
  const name = "Mueble variantes " + suffix,
    slug = "qa-variantes-" + suffix;
  let productId = "";
  let categoryId = "";
  let media: any;
  let customer: any;
  let customerApi: any;
  let customerContext: any;
  let customerHash = "";
  page.on("dialog", (dialog) => dialog.accept());
  try {
    const uploaded = await admin.post("/api/admin/upload", {
      multipart: {
        file: {
          name: "qa-galeria-variante-" + suffix + ".png",
          mimeType: "image/png",
          buffer: await sharp({
            create: {
              width: 600,
              height: 400,
              channels: 3,
              background: "#b7946a",
            },
          })
            .png()
            .toBuffer(),
        },
      },
    });
    expect(uploaded.status()).toBe(201);
    media = await uploaded.json();
    const categorySlug = "qa-ambiente-" + suffix;
    expect(
      (
        await admin.post("/api/admin/categories", {
          data: {
            name: "Estudio " + suffix,
            slug: categorySlug,
            description: "",
            image: "/images/room.webp",
            active: true,
            position: 99,
          },
        })
      ).ok(),
    ).toBe(true);
    const category = await db.category.findUniqueOrThrow({
      where: { slug: categorySlug },
    });
    categoryId = category.id;
    await page.goto("/admin/configuracion");
    const carousel = page.getByRole("group", {
      name: "Carrusel de portada",
      exact: true,
    });
    while (await carousel.locator(".image-list-grid li").count())
      await carousel
        .getByRole("button", { name: "Quitar imagen 1", exact: true })
        .click();
    for (const image of [
      "/images/chair.webp",
      "/images/bed.webp",
      "/images/room.webp",
    ])
      await chooseOption(page, "Añadir imagen a carrusel de portada", image);
    await carousel
      .getByRole("button", { name: "Subir imagen 3", exact: true })
      .click();
    await carousel
      .getByRole("button", { name: "Subir imagen 2", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Cambios guardados");
    await page.goto("/");
    await expect(page.locator(".carousel-slide")).toHaveCount(3);
    await expect(page.locator(".carousel-slide.is-active")).toHaveAttribute(
      "data-image",
      "/images/room.webp",
    );
    await page
      .getByRole("button", { name: "Imagen siguiente", exact: true })
      .click();
    await expect(page.locator(".carousel-slide.is-active")).toHaveAttribute(
      "data-image",
      "/images/chair.webp",
    );
    await page
      .getByRole("button", { name: "Mostrar imagen 3", exact: true })
      .click();
    await expect(page.locator(".carousel-slide.is-active")).toHaveAttribute(
      "data-image",
      "/images/bed.webp",
    );
    await expect(page.locator(".hero-copy,.invitation")).toHaveCount(0);
    await page.screenshot({ path: "docs/carousel-home.png" });
    await page.goto("/admin/productos?edit=new");
    await page.getByLabel("Nombre", { exact: true }).fill(name);
    await page.getByLabel("Enlace (slug)", { exact: true }).fill(slug);
    await page
      .getByLabel("Código interno / SKU", { exact: true })
      .fill("VAR-" + suffix);
    await chooseOption(page, "Categoría", category.id);
    await page
      .getByLabel("Descripción", { exact: true })
      .fill("Un mueble con precios e inventarios independientes.");
    await page.getByLabel("Material", { exact: true }).fill("Madera");
    await page
      .getByLabel("Medidas (ancho × fondo × alto)", { exact: true })
      .fill("80 × 60 × 90 cm");
    await page
      .getByRole("button", { name: "Añadir variante", exact: true })
      .click();
    await page
      .getByLabel("Nombre de variante 1", { exact: true })
      .fill("Natural");
    await page
      .getByLabel("Precio de variante 1 (S/)", { exact: true })
      .fill("100");
    await page.getByLabel("Stock de variante 1", { exact: true }).fill("1");
    await chooseOption(
      page,
      "Añadir imagen a fotos de variante 1",
      "/images/chair.webp",
    );
    await chooseOption(page, "Añadir imagen a fotos de variante 1", media.url);
    await page
      .getByRole("button", { name: "Añadir variante", exact: true })
      .click();
    await page
      .getByLabel("Nombre de variante 2", { exact: true })
      .fill("Blanco");
    await page
      .getByLabel("Precio de variante 2 (S/)", { exact: true })
      .fill("160");
    await page.getByLabel("Stock de variante 2", { exact: true }).fill("3");
    await chooseOption(
      page,
      "Añadir imagen a fotos de variante 2",
      "/images/bed.webp",
    );
    await chooseOption(
      page,
      "Añadir imagen a fotos de variante 2",
      "/images/dining.webp",
    );
    await page
      .getByRole("button", { name: "Guardar cambios", exact: true })
      .click();
    await expect(page).toHaveURL("/admin/productos");
    const product = await db.product.findUniqueOrThrow({
      where: { slug },
      include: {
        variants: { where: { active: true }, orderBy: { position: "asc" } },
      },
    });
    productId = product.id;
    expect(product.price).toBe(10000);
    expect(product.stock).toBe(4);
    expect(product.usesVariants).toBe(true);
    const [natural, white] = product.variants;
    expect((await admin.delete("/api/admin/media/" + media.id)).status()).toBe(
      409,
    );
    await page.goto("/productos");
    let calls = 0;
    page.on("request", (req) => {
      if (new URL(req.url()).pathname.startsWith("/api/")) calls++;
    });
    const nav = page.getByRole("navigation", { name: "Navegación principal" });
    await nav.getByRole("link", { name: "Colección", exact: true }).hover();
    await expect(page.locator(".nav-quick-product")).toHaveCount(6);
    await nav.getByRole("link", { name: category.name, exact: true }).hover();
    await expect(page.locator(".nav-quick-product")).toHaveCount(1);
    await page.locator(".nav-quick-product").hover();
    await expect(page.locator(".nav-preview-panel")).toBeVisible();
    expect(calls).toBe(0);
    await page.screenshot({ path: "docs/navigation-quick-access.png" });
    await page.keyboard.press("Escape");
    const card = page
      .locator(".product-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await card.hover();
    await card
      .getByRole("button", {
        name: `Ver variante Blanco de ${name}`,
        exact: true,
      })
      .hover();
    await expect(card.locator(".product-price")).toContainText("160.00");
    expect(calls).toBe(0);
    await card.locator(".product-image").click();
    await expect(page).toHaveURL(new RegExp("variante=" + white.id));
    await expect(page.locator(".detail-price")).toContainText("160.00");
    await page
      .getByRole("button", { name: "Ver foto 2 de Blanco", exact: true })
      .click();
    await expect(page.locator(".detail-image img")).toHaveAttribute(
      "src",
      /dining/,
    );
    await page
      .getByRole("button", { name: "Añadir a la bolsa", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Elegir variante Natural", exact: true })
      .click();
    await expect(page.locator(".detail-price")).toContainText("100.00");
    await expect(page).toHaveURL(new RegExp("variante=" + natural.id));
    await page
      .getByRole("button", { name: "Añadir a la bolsa", exact: true })
      .click();
    await page.screenshot({
      path: "docs/product-independent-variants.png",
      fullPage: true,
    });
    await page.goto("/carrito");
    await expect(page.locator(".cart-line")).toHaveCount(2);
    const whiteLine = page.locator(".cart-line").filter({ hasText: "Blanco" });
    await whiteLine.locator(".quantity button").last().click();
    await expect(whiteLine.locator(".quantity span")).toHaveText("2");
    await whiteLine.locator(".quantity button").first().click();
    await expect(whiteLine.locator(".quantity span")).toHaveText("1");
    customer = await db.user.create({
      data: {
        name: "Cliente de variantes",
        email: "qa-variants-" + suffix + "@example.com",
        phone: "999111222",
        passwordHash: "qa-session-only",
        role: "CUSTOMER",
      },
    });
    const customerToken = randomUUID();
    customerHash = createHash("sha256").update(customerToken).digest("hex");
    await db.session.create({
      data: {
        userId: customer.id,
        tokenHash: customerHash,
        expiresAt: new Date(Date.now() + 300000),
      },
    });
    customerApi = await playwright.request.newContext({
      baseURL: "http://localhost:3012",
      extraHTTPHeaders: {
        ...origin,
        Cookie: "jhamor_session=" + customerToken,
      },
    });
    customerContext = await context
      .browser()!
      .newContext({ viewport: { width: 1440, height: 1000 } });
    await customerContext.addCookies([
      {
        name: "jhamor_session",
        value: customerToken,
        url: "http://localhost:3012",
      },
    ]);
    const account = await customerContext.newPage();
    await account.goto("http://localhost:3012/mi-cuenta");
    await expect(account.locator(".account-welcome")).toBeVisible();
    expect(
      await account
        .locator(".account-profile")
        .evaluate((el: HTMLElement) => el.getBoundingClientRect().width),
    ).toBeGreaterThan(350);
    await account.screenshot({
      path: "docs/account-dashboard.png",
      fullPage: true,
    });
    await account.setViewportSize({ width: 390, height: 844 });
    await account.screenshot({
      path: "docs/account-dashboard-mobile.png",
      fullPage: true,
    });
    expect(
      await account.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const order = (variantId: string, key = randomUUID()) => ({
      idempotencyKey: key,
      items: [
        {
          productId,
          variantId,
          quantity: 1,
          finish: "Manipulado",
          unitPrice: 1,
        },
      ],
      name: customer.name,
      phone: customer.phone,
      address: "Avenida de prueba 123",
      district: "Lima",
      delivery: "DELIVERY",
      payment: "YAPE",
      notes: "",
    });
    const first = order(natural.id);
    const responses = await Promise.all([
      customerApi.post("/api/orders", { data: first }),
      customerApi.post("/api/orders", { data: order(natural.id) }),
    ]);
    expect(responses.map((r) => r.status()).sort()).toEqual([201, 409]);
    const winner = await responses.find((r) => r.status() === 201)!.json();
    expect(winner.items[0].variantId).toBe(natural.id);
    expect(winner.items[0].finish).toBe("Natural");
    expect(winner.items[0].unitPrice).toBe(10000);
    expect(
      (await db.productVariant.findUniqueOrThrow({ where: { id: white.id } }))
        .stock,
    ).toBe(3);
    expect(
      (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock,
    ).toBe(3);
    const retry = { ...first, idempotencyKey: winner.idempotencyKey };
    expect(
      (await customerApi.post("/api/orders", { data: retry })).status(),
    ).toBe(201);
    const fields = {
      name,
      slug,
      sku: product.sku,
      description: product.description,
      price: product.price,
      salePrice: null,
      categoryId: category.id,
      image: product.image,
      gallery: [],
      material: product.material,
      dimensions: product.dimensions,
      finishes: [],
      leadDays: 7,
      stock: 3,
      madeToOrder: false,
      featured: true,
      active: true,
    };
    const compact = (v: any) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      stock: v.stock,
      image: v.image,
      gallery: v.gallery,
    });
    expect(
      (
        await admin.patch("/api/admin/products/" + productId, {
          data: { ...fields, variants: [compact(white)] },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await admin.patch("/api/admin/orders/" + winner.id, {
          data: {
            status: "CANCELLED",
            paymentStatus: "PENDING",
            note: "Prueba de reposición",
          },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (await db.productVariant.findUniqueOrThrow({ where: { id: natural.id } }))
        .stock,
    ).toBe(1);
    expect(
      (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock,
    ).toBe(3);
    expect(
      (
        await admin.patch("/api/admin/orders/" + winner.id, {
          data: { status: "CANCELLED", paymentStatus: "PENDING", note: "" },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (await db.productVariant.findUniqueOrThrow({ where: { id: natural.id } }))
        .stock,
    ).toBe(1);
    expect(
      (
        await admin.post("/api/admin/coupons", {
          data: {
            code: "VAR-" + suffix,
            percent: 10,
            minimum: 0,
            active: true,
            expiresAt: null,
          },
        })
      ).ok(),
    ).toBe(true);
    const quote = await customerApi.post("/api/quote", {
      data: {
        coupon: "VAR-" + suffix,
        items: [
          { productId, variantId: white.id, quantity: 2, finish: "incorrecto" },
        ],
      },
    });
    expect(quote.status()).toBe(200);
    expect((await quote.json()).discount).toBe(3200);
    expect(
      (
        await customerApi.post("/api/orders", { data: order(randomUUID()) })
      ).status(),
    ).toBe(409);
    await account.goto("http://localhost:3012/mi-cuenta");
    await expect(account.locator(".account-order")).toHaveCount(1);
    await account.screenshot({
      path: "docs/account-orders-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
    await page
      .getByRole("button", {
        name: `Mostrar productos de ${category.name}`,
        exact: true,
      })
      .click();
    await expect(page.locator(".nav-quick-product")).toHaveCount(1);
    await page.locator(".nav-quick-product").click();
    await expect(page).toHaveURL(new RegExp(slug));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  } finally {
    await admin.put("/api/admin/settings", { data: original.value });
    if (productId) await admin.delete("/api/admin/products/" + productId);
    if (categoryId) await admin.delete("/api/admin/categories/" + categoryId);
    await customerContext?.close();
    await customerApi?.dispose();
    await admin.dispose();
    await db.session.deleteMany({
      where: { tokenHash: { in: [tokenHash, customerHash].filter(Boolean) } },
    });
  }
});
