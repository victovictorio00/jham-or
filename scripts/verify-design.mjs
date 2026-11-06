import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = process.env.DESIGN_BASE_URL || "http://localhost:3012";
const browser = await chromium.launch();
const report = {
  at: new Date().toISOString(),
  base,
  views: [],
  javascriptErrors: [],
  externalRequests: [],
};
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  page.on("pageerror", (error) => report.javascriptErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.protocol.startsWith("http") &&
      url.origin !== new URL(base).origin &&
      !report.externalRequests.includes(url.origin)
    )
      report.externalRequests.push(url.origin);
  });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const path of [
      "/",
      "/productos",
      "/productos/sofa-olivo",
      "/nosotros",
      "/contacto",
      "/auth/registro",
      "/carrito",
    ]) {
      const response = await page.goto(base + path);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      const title = await page.locator("h1").count();
      report.views.push({
        width,
        path,
        status: response.status(),
        overflow,
        h1: title,
      });
      if (overflow || response.status() !== 200 || title !== 1)
        throw new Error(`Revisar ${path} en ${width}px`);
      if (
        [390, 1440].includes(width) &&
        ["/", "/productos", "/productos/sofa-olivo"].includes(path)
      )
        await page.screenshot({
          path: `docs/design-${path === "/" ? "home" : path === "/productos" ? "catalog" : "product"}-${width}.png`,
          fullPage: true,
        });
    }
  }
  if (report.javascriptErrors.length || report.externalRequests.length)
    throw new Error("Revisar errores o solicitudes externas");
} finally {
  await writeFile(
    "docs/design-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
console.log(
  JSON.stringify({
    views: report.views.length,
    javascriptErrors: report.javascriptErrors.length,
    externalRequests: report.externalRequests.length,
  }),
);
