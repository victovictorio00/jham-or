import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import sharp from "sharp";
const base = "https://jhamor.purprum.com";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
});
const report = {
  at: new Date().toISOString(),
  base,
  desktopEditorialLayout: false,
  mobileLayout: false,
  localFonts: false,
  updatedFavicon: false,
  groupDropAndAppend: false,
  uploadApiCalls: 0,
  javascriptErrors: [],
};
let authenticated = false;
try {
  const page = await context.newPage();
  page.on("pageerror", (error) => report.javascriptErrors.push(error.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  report.desktopEditorialLayout = await page
    .locator(".home-carousel")
    .evaluate((el) => el.getBoundingClientRect().width >= innerWidth - 2);
  report.localFonts = await page
    .locator("h1")
    .evaluate((el) =>
      getComputedStyle(el).fontFamily.toLowerCase().includes("editorial"),
    );
  report.updatedFavicon = (
    await (await context.request.get(base + "/icon.svg")).text()
  ).includes("#302923");
  await page.screenshot({ path: "var/design-production-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  report.mobileLayout = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <= innerWidth + 1 &&
      document.querySelector(".home-carousel").getBoundingClientRect().width <=
        innerWidth + 1,
  );
  await page.screenshot({ path: "var/design-production-mobile.png" });
  const login = await context.request.post(base + "/api/auth/login", {
    headers: { Origin: base },
    data: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
  });
  if (!login.ok()) throw new Error("No se pudo verificar el panel.");
  authenticated = true;
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(base + "/admin/media");
  if (
    !(await page
      .locator("input[type=file]")
      .evaluate((input) => input.multiple))
  )
    throw new Error("Falta la selección múltiple.");
  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#b9956b" },
  })
    .png()
    .toBuffer();
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/admin/upload")
      report.uploadApiCalls++;
  });
  const transfer = await page.evaluateHandle((base64) => {
    const data = new DataTransfer();
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    for (let i = 0; i < 2; i++)
      data.items.add(
        new File([bytes], `verificacion-grupo-${i}.png`, { type: "image/png" }),
      );
    return data;
  }, buffer.toString("base64"));
  await page
    .locator(".upload-dropzone")
    .dispatchEvent("drop", { dataTransfer: transfer });
  await page.locator("input[type=file]").setInputFiles({
    name: "verificacion-adicional.png",
    mimeType: "image/png",
    buffer,
  });
  await page.waitForFunction(
    () => document.querySelectorAll(".upload-queue li").length === 3,
  );
  report.groupDropAndAppend =
    (await page.locator(".upload-queue li").count()) === 3;
  await page
    .getByRole("button", { name: "Vaciar selección", exact: true })
    .click();
  if (
    !report.desktopEditorialLayout ||
    !report.mobileLayout ||
    !report.localFonts ||
    !report.updatedFavicon ||
    !report.groupDropAndAppend ||
    report.uploadApiCalls ||
    report.javascriptErrors.length
  )
    throw new Error("La verificación final requiere revisión.");
} finally {
  if (authenticated)
    await context.request
      .post(base + "/api/auth/logout", { headers: { Origin: base } })
      .catch(() => {});
  await browser.close();
  await writeFile(
    "docs/editorial-production-verification.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify(report, null, 2));
