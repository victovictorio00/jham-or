import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = process.env.DESIGN_BASE_URL || "https://jhamor.purprum.com";
const output =
  process.env.DESIGN_REPORT || "docs/scroll-format-verification.json";
const browser = await chromium.launch();
const report = {
  at: new Date().toISOString(),
  base,
  homeProducts: null,
  desktopReveal: false,
  mobileReveal: false,
  carouselRatioDesktop: null,
  carouselRatioMobile: null,
  imagesNotCropped: false,
  reducedMotion: false,
  withoutJavascript: false,
  adminPanoramicPreview: false,
  adminFormatGuidance: false,
  scrollApiRequests: 0,
  javascriptErrors: [],
};
let authenticated;
try {
  for (const [label, width, height] of [
    ["desktop", 1440, 950],
    ["mobile", 390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
      isMobile: label === "mobile",
      hasTouch: label === "mobile",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => report.javascriptErrors.push(e.message));
    await page.goto(base);
    await page.locator(".home-carousel").waitFor();
    const box = await page.locator(".home-carousel").boundingBox();
    const ratio = box.width / box.height;
    if (Math.abs(ratio - 16 / 7) > 0.02)
      throw Error("Formato panorámico variable");
    report[
      label === "desktop" ? "carouselRatioDesktop" : "carouselRatioMobile"
    ] = Math.round(ratio * 1000) / 1000;
    if (
      (await page
        .locator(".carousel-slide img")
        .first()
        .evaluate((el) => getComputedStyle(el).objectFit)) !== "contain"
    )
      throw Error("Imagen recortada");
    report.imagesNotCropped = true;
    report.homeProducts = await page.locator(".product-card").count();
    if (report.homeProducts > 6)
      throw Error("Más de seis productos en portada");
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.startsWith("/api/"))
        report.scrollApiRequests++;
    });
    const card = page.locator(".product-card").first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      document.querySelector('.product-card[data-revealed="true"]'),
    );
    report[label === "desktop" ? "desktopReveal" : "mobileReveal"] = true;
    await page.waitForTimeout(1150);
    if (!(await card.isVisible()))
      throw Error("Producto oculto después de animación");
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error("Desbordamiento");
    await page.screenshot({
      path:
        label === "desktop"
          ? "docs/scroll-products-desktop.png"
          : "docs/scroll-products-mobile.png",
    });
    await context.close();
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(base);
  await reducedPage.locator(".product-card").first().scrollIntoViewIfNeeded();
  await reducedPage.waitForTimeout(150);
  report.reducedMotion =
    (await reducedPage.locator("[data-revealed]").count()) === 0 &&
    (await reducedPage.locator(".product-card").first().isVisible());
  await reduced.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base);
  report.withoutJavascript = await staticPage
    .locator(".product-card")
    .first()
    .isVisible();
  await staticContext.close();
  const admin = await browser.newContext();
  authenticated = admin;
  const login = await admin.request.post(base + "/api/auth/login", {
    headers: { Origin: base },
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  if (!login.ok()) throw Error("No se pudo revisar el editor");
  const page = await admin.newPage();
  await page.goto(base + "/admin/configuracion");
  const group = page.getByRole("group", {
    name: "Carrusel de portada",
    exact: true,
  });
  await group.waitFor();
  report.adminFormatGuidance = (await group.innerText()).includes("1920 × 840");
  const preview = await group
    .locator(".image-list-preview")
    .first()
    .boundingBox();
  report.adminPanoramicPreview =
    Math.abs(preview.width / preview.height - 16 / 7) < 0.02;
  if (
    report.scrollApiRequests ||
    report.javascriptErrors.length ||
    Object.values(report).some((v) => v === false)
  )
    throw Error("Verificación incompleta");
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (authenticated) {
    await authenticated.request
      .post(base + "/api/auth/logout", { headers: { Origin: base } })
      .catch(() => {});
    await authenticated.close();
  }
  await browser.close();
}
