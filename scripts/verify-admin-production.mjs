import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = "https://jhamor.purprum.com";
const browser = await chromium.launch();
const report = {
  at: new Date().toISOString(),
  decorativeHeaderRemoved: false,
  compactNavigation: false,
  preferencePersisted: false,
  mobileNavigation: false,
  coverSelectionApiRequests: null,
  libraryRefreshApiRequests: null,
  javascriptErrors: [],
};
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.javascriptErrors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  const login = await context.request.post(base + "/api/auth/login", {
    headers: { Origin: base },
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  if (!login.ok())
    throw new Error("No se pudo verificar el acceso administrativo.");
  await page.goto(base + "/admin");
  await page.getByRole("heading", { level: 1 }).waitFor();
  if (
    (await page.locator(".admin-header").count()) ||
    (await page.getByText("Tu negocio, en orden.", { exact: true }).count())
  )
    throw new Error("Cabecera decorativa presente");
  report.decorativeHeaderRemoved = true;
  await page.getByRole("button", { name: "Contraer menú lateral" }).click();
  if (
    (await page
      .locator(".admin-sidebar")
      .evaluate((el) => el.getBoundingClientRect().width)) > 80
  )
    throw new Error("El menú no se contrajo");
  await page.getByRole("link", { name: "Imágenes", exact: true }).click();
  await page.waitForURL(base + "/admin/media");
  report.compactNavigation = true;
  await page.reload();
  await page.getByRole("button", { name: "Expandir menú lateral" }).waitFor();
  report.preferencePersisted = true;
  await page
    .getByRole("link", { name: "Diseño y tienda", exact: true })
    .click();
  await page.waitForURL(base + "/admin/configuracion");
  const group = page.getByRole("group", {
    name: "Carrusel de portada",
    exact: true,
  });
  const before = await group.locator(".image-list-grid li").count();
  if (before >= 8)
    await group
      .getByRole("button", { name: "Quitar imagen 8", exact: true })
      .click();
  const control = page.getByRole("combobox", {
    name: "Añadir imagen a carrusel de portada",
    exact: true,
  });
  const alternative = await page
    .locator(".select-control")
    .filter({ has: control })
    .locator("select option")
    .evaluateAll((options) => options.map((o) => o.value).find(Boolean));
  let calls = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) calls++;
  });
  if (alternative) {
    await control.click();
    await page.locator(`[role=option][data-value="${alternative}"]`).click();
    await group.locator(".image-list-grid li").last().locator("img").waitFor();
  }
  report.coverSelectionApiRequests = calls;
  if (calls !== 0) throw new Error("Seleccionar imagen consultó la API");
  const brand = page.getByLabel("Nombre de la marca", { exact: true });
  const original = await brand.inputValue();
  await brand.fill("Verificación sin guardar");
  await page
    .getByRole("button", { name: "Actualizar biblioteca", exact: true })
    .click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) =>
        button.textContent?.trim() === "Actualizar biblioteca" &&
        !button.disabled,
    ),
  );
  report.libraryRefreshApiRequests = calls;
  if (calls !== 1) throw new Error("Biblioteca consultada más de una vez");
  if ((await brand.inputValue()) !== "Verificación sin guardar")
    throw new Error("Se perdió el formulario");
  await brand.fill(original);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await page.getByRole("link", { name: "Muebles", exact: true }).click();
  await page.waitForURL(base + "/admin/productos");
  if (
    !(await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ))
  )
    throw new Error("Desbordamiento móvil");
  report.mobileNavigation = true;
  await context.request.post(base + "/api/auth/logout", {
    headers: { Origin: base },
  });
  if (report.javascriptErrors.length)
    throw new Error(report.javascriptErrors.join("\n"));
  await context.close();
  await writeFile(
    "docs/admin-production-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
