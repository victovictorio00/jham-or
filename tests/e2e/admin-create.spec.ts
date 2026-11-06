import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID, createHash } from "node:crypto";
import { chooseOption } from "../helpers/select";
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());
test("create records, show required fields, validate errors and use searchable selectors", async ({
  page,
  context,
  playwright,
}) => {
  test.setTimeout(90000);
  const owner = await db.user.findUniqueOrThrow({
    where: { email: process.env.ADMIN_EMAIL },
  });
  const token = randomUUID();
  const tokenHash = createHash("sha256").update(token).digest("hex");
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
  const suffix = randomUUID().slice(0, 8);
  page.on("dialog", (dialog) => dialog.accept());
  try {
    await page.goto("/admin/categorias?edit=new");
    await expect(
      page.getByText("Campo obligatorio.", { exact: false }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    const name = "Categoría creación " + suffix;
    await page.getByLabel("Nombre", { exact: true }).fill(name);
    await expect(page.getByLabel("Enlace (slug)", { exact: true })).toHaveValue(
      "categoria-creacion-" + suffix,
    );
    await expect(
      page.getByLabel("Enlace (slug)", { exact: true }),
    ).not.toHaveAttribute("aria-invalid", "true");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/categorias");
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    const category = await db.category.findUniqueOrThrow({
      where: { slug: "categoria-creacion-" + suffix },
    });
    await page.goto("/admin/productos?edit=new");
    await page
      .getByLabel("Nombre", { exact: true })
      .fill("Mueble creación " + suffix);
    await page
      .getByLabel("Código interno / SKU", { exact: true })
      .fill("SKU-" + suffix);
    await page
      .locator("label")
      .filter({
        has: page.getByRole("combobox", { name: "Categoría", exact: true }),
      })
      .locator(".field-caption")
      .click();
    await expect(
      page.getByRole("listbox", { name: "Categoría", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await chooseOption(page, "Categoría", category.id);
    await page
      .getByLabel("Descripción", { exact: true })
      .fill("Descripción de creación");
    await page.getByLabel("Precio (S/)", { exact: true }).fill("129.90");
    let calls = 0;
    page.on("request", (req) => {
      if (new URL(req.url()).pathname.startsWith("/api/")) calls++;
    });
    const count = calls;
    await page
      .getByRole("combobox", { name: "Imagen principal", exact: true })
      .click();
    await page.screenshot({ path: "docs/admin-select-options.png" });
    await page
      .getByRole("textbox", { name: "Buscar en Imagen principal" })
      .fill("Muestra: chair");
    await expect(page.getByRole("option")).toHaveCount(1);
    await page
      .getByRole("option", { name: "Muestra: chair", exact: true })
      .click();
    expect(calls).toBe(count);
    await page.getByLabel("Material", { exact: true }).fill("Madera");
    await page
      .getByLabel("Medidas (ancho × fondo × alto)", { exact: true })
      .fill("60 × 50 × 80 cm");
    await page.getByLabel("Precio de oferta (S/)", { exact: true }).fill("150");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.locator("#error-salePrice")).toContainText("menor");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(
      "Mueble creación " + suffix,
    );
    await page
      .getByLabel("Precio de oferta (S/)", { exact: true })
      .fill("99.90");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/productos");
    await expect(
      page.getByText("Mueble creación " + suffix, { exact: true }),
    ).toBeVisible();
    expect(
      (await db.product.findUniqueOrThrow({ where: { sku: "SKU-" + suffix } }))
        .price,
    ).toBe(12990);
    await page.goto("/admin/categorias?edit=new");
    await page
      .getByLabel("Nombre", { exact: true })
      .fill("Duplicada " + suffix);
    await page.getByLabel("Enlace (slug)", { exact: true }).fill(category.slug);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.locator("#error-slug")).toContainText("existe");
    await page
      .getByLabel("Enlace (slug)", { exact: true })
      .fill("otra-" + suffix);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/categorias");
    await page.goto("/admin/paginas?edit=new");
    await page
      .getByLabel("Título", { exact: true })
      .fill("Página creación " + suffix);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/paginas");
    await page.goto("/admin/cupones?edit=new");
    await page.getByLabel("Código", { exact: true }).fill("CREAR-" + suffix);
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/cupones");
    await page.goto("/admin/clientes?edit=new");
    await expect(
      page.getByLabel("Contraseña inicial (mínimo 12 caracteres)", {
        exact: true,
      }),
    ).toHaveJSProperty("required", true);
    await page
      .getByLabel("Nombre completo", { exact: true })
      .fill("Cliente creación " + suffix);
    await page
      .getByLabel("Correo electrónico", { exact: true })
      .fill("crear-" + suffix + "@example.com");
    await page
      .getByLabel("Contraseña inicial (mínimo 12 caracteres)", { exact: true })
      .fill("CrearPrueba123456!");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/clientes");
    await page.goto("/admin/equipo?edit=new");
    await page
      .getByLabel("Nombre completo", { exact: true })
      .fill("Admin creación " + suffix);
    await page
      .getByLabel("Correo electrónico", { exact: true })
      .fill("admin-crear-" + suffix + "@example.com");
    await page
      .getByLabel("Contraseña inicial (mínimo 12 caracteres)", { exact: true })
      .fill("CrearPrueba123456!");
    const permission = page.getByRole("combobox", {
      name: "Permiso",
      exact: true,
    });
    await permission.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("End");
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await chooseOption(page, "Permiso", "ADMIN");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page).toHaveURL("/admin/equipo");
    const administrator = await db.user.findUniqueOrThrow({
      where: { email: "admin-crear-" + suffix + "@example.com" },
    });
    const adminToken = randomUUID();
    const adminHash = createHash("sha256").update(adminToken).digest("hex");
    await db.session.create({
      data: {
        userId: administrator.id,
        tokenHash: adminHash,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const adminApi = await playwright.request.newContext({
      baseURL: "http://localhost:3012",
      extraHTTPHeaders: {
        Origin: "http://localhost:3012",
        Cookie: "jhamor_session=" + adminToken,
      },
    });
    try {
      expect(
        (
          await adminApi.post("/api/admin/users", {
            data: {
              name: "Cliente de administrador",
              email: "cliente-admin-" + suffix + "@example.com",
              phone: "",
              active: true,
              role: "CUSTOMER",
              password: "CrearPrueba123456!",
            },
          })
        ).status(),
      ).toBe(200);
      expect(
        (
          await adminApi.post("/api/admin/users", {
            data: {
              name: "Permiso rechazado",
              email: "rechazado-" + suffix + "@example.com",
              phone: "",
              active: true,
              role: "OWNER",
              password: "CrearPrueba123456!",
            },
          })
        ).status(),
      ).toBe(403);
    } finally {
      await adminApi.dispose();
      await db.session.deleteMany({ where: { tokenHash: adminHash } });
    }
    await page.goto("/admin/productos?edit=new");
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("combobox", { name: "Categoría", exact: true })
      .click();
    expect(
      await page.locator(".select-popover").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.left >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight
        );
      }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.screenshot({
      path: "docs/admin-required-fields.png",
      fullPage: true,
    });
  } finally {
    const product = await db.product.findUnique({
      where: { sku: "SKU-" + suffix },
    });
    if (product)
      await page.request.delete("/api/admin/products/" + product.id, {
        headers: { Origin: "http://localhost:3012" },
      });
    for (const slug of ["categoria-creacion-" + suffix, "otra-" + suffix]) {
      const category = await db.category.findUnique({ where: { slug } });
      if (category)
        await page.request.delete("/api/admin/categories/" + category.id, {
          headers: { Origin: "http://localhost:3012" },
        });
    }

    await db.session.deleteMany({ where: { tokenHash } });
  }
});
