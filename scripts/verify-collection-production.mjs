import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = process.env.COLLECTION_BASE_URL || "https://jhamor.purprum.com";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const report = {
  at: new Date().toISOString(),
  base,
  carousel: false,
  navigation: false,
  hoverApiRequests: null,
  variantEditor: false,
  accountDesktop: false,
  accountMobile: false,
  javascriptErrors: [],
};
const page = await context.newPage();
page.on("pageerror", (e) => report.javascriptErrors.push(e.message));
try {
  await page.goto(base);
  await page.locator(".home-carousel").waitFor();
  if (await page.locator(".hero-copy,.invitation").count())
    throw Error("Portada anterior presente");
  const slides = await page.locator(".carousel-slide img").count();
  if (slides < 1 || slides > 3)
    throw Error("Carga inicial incorrecta del carrusel");
  const next = page.getByRole("button", {
    name: "Imagen siguiente",
    exact: true,
  });
  if (await next.count()) {
    const image = await page
      .locator(".carousel-slide.is-active")
      .getAttribute("data-image");
    await next.click();
    await page.waitForFunction(
      (old) =>
        document
          .querySelector(".carousel-slide.is-active")
          ?.getAttribute("data-image") !== old,
      image,
    );
  }
  report.carousel = true;
  let calls = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) calls++;
  });
  await page
    .getByRole("link", { name: "Colección", exact: true })
    .first()
    .hover();
  await page.locator(".nav-preview-panel").waitFor();
  const count = await page.locator(".nav-quick-product").count();
  if (count > 6) throw Error("Más de seis accesos rápidos");
  await page.locator(".nav-preview-panel").hover();
  await page.waitForTimeout(250);
  if (!(await page.locator(".nav-preview-panel").isVisible()))
    throw Error("Menú no accesible");
  report.hoverApiRequests = calls;
  if (calls) throw Error("Hover consultó API");
  report.navigation = true;
  const login = await context.request.post(base + "/api/auth/login", {
    headers: { Origin: base },
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  if (!login.ok()) throw Error("Acceso de verificación no disponible");
  await page.goto(base + "/admin/productos?edit=new");
  await page
    .getByRole("button", { name: "Añadir variante", exact: true })
    .click();
  const variant = page.locator(".variant-editor-card").first();
  await variant.waitFor();
  for (const name of [
    "Nombre de variante 1",
    "Precio de variante 1 (S/)",
    "Stock de variante 1",
  ]) {
    if (
      !(await variant
        .getByLabel(name, { exact: true })
        .evaluate((el) => el.required))
    )
      throw Error("Campo obligatorio de variante ausente");
  }
  if (!(await variant.locator(".image-list-editor").count()))
    throw Error("Galería independiente ausente");
  report.variantEditor = true;
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(base + "/mi-cuenta");
  await page.locator(".account-welcome").waitFor();
  report.accountDesktop =
    (await page.locator(".account-profile").boundingBox()).width > 350;
  if (!report.accountDesktop) throw Error("Cuenta comprimida");
  await page.setViewportSize({ width: 390, height: 844 });
  report.accountMobile = await page.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth + 1,
  );
  if (!report.accountMobile) throw Error("Desbordamiento móvil");
  if (report.javascriptErrors.length)
    throw Error(report.javascriptErrors.join("\n"));
  await writeFile(
    "docs/collection-production-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.request
    .post(base + "/api/auth/logout", { headers: { Origin: base } })
    .catch(() => {});
  await context.close();
  await browser.close();
}
