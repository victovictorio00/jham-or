import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = "https://jhamor.purprum.com";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
});
let authenticated = false;
const report = {
  at: new Date().toISOString(),
  base,
  publicRequiredMarkers: false,
  customerCreationRoute: false,
  initialPasswordRequired: false,
  productRequiredMarkers: false,
  styledOptions: false,
  searchableImages: false,
  thumbnails: false,
  mobileOptionsFit: false,
  keyboardClose: false,
  selectionApiRequests: 0,
  emptyCreationApiRequests: 0,
  javascriptErrors: [],
};
try {
  const page = await context.newPage();
  page.on("pageerror", (error) => report.javascriptErrors.push(error.message));
  await page.goto(base + "/auth/registro");
  report.publicRequiredMarkers = await page
    .locator("form input[required]")
    .evaluateAll(
      (inputs) =>
        inputs.length > 0 &&
        inputs.every((input) =>
          input.closest("label")?.querySelector(".required-mark"),
        ),
    );
  const login = await context.request.post(base + "/api/auth/login", {
    headers: { Origin: base },
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  if (!login.ok()) throw new Error("No se pudo verificar el acceso.");
  authenticated = true;
  const customer = await page.goto(base + "/admin/clientes?edit=new");
  report.customerCreationRoute =
    customer.status() === 200 &&
    (await page
      .getByRole("heading", { name: "Añadir cliente", exact: true })
      .count()) === 1;
  report.initialPasswordRequired = await page
    .getByLabel("Contraseña inicial (mínimo 12 caracteres)", { exact: true })
    .evaluate((input) => input.required);
  await page.goto(base + "/admin/productos?edit=new");
  report.productRequiredMarkers = await page
    .locator(".editor-form [required]")
    .evaluateAll(
      (inputs) =>
        inputs.length > 0 &&
        inputs.every((input) =>
          input.closest("label")?.querySelector(".required-mark"),
        ),
    );
  let api = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) api++;
  });
  await page
    .getByRole("combobox", { name: "Imagen principal", exact: true })
    .click();
  await page
    .getByRole("listbox", { name: "Imagen principal", exact: true })
    .waitFor();
  report.styledOptions = true;
  report.thumbnails = (await page.locator(".select-option img").count()) > 0;
  await page
    .getByRole("textbox", { name: "Buscar en Imagen principal", exact: true })
    .fill("Muestra: chair");
  await page.waitForFunction(
    () => document.querySelectorAll("[role=option]").length === 1,
  );
  report.searchableImages = true;
  await page.keyboard.press("Escape");
  report.keyboardClose = (await page.getByRole("listbox").count()) === 0;
  report.selectionApiRequests = api;
  await page
    .getByRole("button", { name: "Guardar cambios", exact: true })
    .click();
  await page.locator("#error-name").waitFor();
  report.emptyCreationApiRequests = api;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("combobox", { name: "Categoría", exact: true }).click();
  await page.waitForFunction(() => {
    const el = document.querySelector(".select-popover");
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.left >= 0 &&
      rect.right <= innerWidth &&
      rect.top >= 0 &&
      rect.bottom <= innerHeight
    );
  });
  report.mobileOptionsFit = true;
  await page.keyboard.press("Escape");
  if (
    !report.publicRequiredMarkers ||
    !report.customerCreationRoute ||
    !report.initialPasswordRequired ||
    !report.productRequiredMarkers ||
    !report.styledOptions ||
    !report.searchableImages ||
    !report.thumbnails ||
    !report.mobileOptionsFit ||
    !report.keyboardClose ||
    report.selectionApiRequests ||
    report.emptyCreationApiRequests ||
    report.javascriptErrors.length
  )
    throw new Error("Revisar la verificación de formularios.");
} finally {
  if (authenticated)
    await context.request
      .post(base + "/api/auth/logout", { headers: { Origin: base } })
      .catch(() => {});
  await browser.close();
  await writeFile(
    "docs/forms-production-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify(report, null, 2));
