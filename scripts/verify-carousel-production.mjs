import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = process.env.CAROUSEL_BASE_URL || "https://jhamor.purprum.com";
const output =
  process.env.CAROUSEL_REPORT || "docs/carousel-drag-verification.json";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  reducedMotion: "no-preference",
});
const report = {
  at: new Date().toISOString(),
  base,
  noPauseControl: false,
  mouseDrag: false,
  reverseMouseDrag: false,
  smallMovementIgnored: false,
  automaticWhileHovered: false,
  automaticAfterArrowClick: false,
  touchSwipe: false,
  verticalGestureIgnored: false,
  reducedMotionRespected: false,
  apiRequests: 0,
  javascriptErrors: [],
};
try {
  const page = await context.newPage();
  page.on("pageerror", (error) => report.javascriptErrors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      report.apiRequests++;
  });
  await page.goto(base);
  await page.locator(".carousel-slide.is-active img").waitFor();
  await page.waitForFunction(
    () => document.querySelector(".carousel-slide.is-active img")?.complete,
  );
  const active = () =>
    page.locator(".carousel-slide.is-active").getAttribute("data-image");
  const waitChanged = async (old) =>
    page.waitForFunction(
      (image) =>
        document
          .querySelector(".carousel-slide.is-active")
          ?.getAttribute("data-image") !== image,
      old,
      { timeout: 8500 },
    );
  report.noPauseControl =
    (await page
      .getByRole("button", { name: /Pausar carrusel|Reanudar carrusel/ })
      .count()) === 0;
  if ((await page.locator(".carousel-slide").count()) < 2)
    throw Error("Se necesitan dos imágenes para verificar el cambio");
  const box = await page.locator(".home-carousel").boundingBox();
  const x = box.x + box.width * 0.6,
    y = box.y + box.height * 0.5;
  const drag = async (dx, dy = 0) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 8 });
    await page.mouse.up();
  };
  let old = await active();
  await drag(-160);
  await waitChanged(old);
  report.mouseDrag = true;
  const second = await active();
  await drag(160);
  await waitChanged(second);
  report.reverseMouseDrag = (await active()) === old;
  old = await active();
  await drag(15);
  report.smallMovementIgnored = (await active()) === old;
  await page.mouse.move(x, y);
  await waitChanged(old);
  report.automaticWhileHovered = true;
  await page
    .getByRole("button", { name: "Imagen siguiente", exact: true })
    .click();
  old = await active();
  await waitChanged(old);
  report.automaticAfterArrowClick = true;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  old = await active();
  await page.waitForTimeout(6500);
  report.reducedMotionRespected = (await active()) === old;
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  try {
    const touch = await mobile.newPage();
    touch.on("pageerror", (error) =>
      report.javascriptErrors.push(error.message),
    );
    touch.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/"))
        report.apiRequests++;
    });
    await touch.goto(base);
    await touch.locator(".home-carousel").waitFor();
    const region = await touch.locator(".home-carousel").boundingBox();
    const cdp = await mobile.newCDPSession(touch);
    const swipe = async (dx, dy) => {
      const sx = region.x + region.width * 0.65,
        sy = region.y + region.height * 0.4;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: sx, y: sy }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: sx + dx, y: sy + dy }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    };
    old = await touch
      .locator(".carousel-slide.is-active")
      .getAttribute("data-image");
    await swipe(-130, 0);
    await touch.waitForFunction(
      (image) =>
        document
          .querySelector(".carousel-slide.is-active")
          ?.getAttribute("data-image") !== image,
      old,
    );
    report.touchSwipe = true;
    old = await touch
      .locator(".carousel-slide.is-active")
      .getAttribute("data-image");
    await swipe(5, -110);
    await touch.waitForTimeout(200);
    report.verticalGestureIgnored =
      (await touch
        .locator(".carousel-slide.is-active")
        .getAttribute("data-image")) === old;
  } finally {
    await mobile.close();
  }
  if (
    report.apiRequests ||
    report.javascriptErrors.length ||
    Object.values(report).some((value) => value === false)
  )
    throw Error("El carrusel no superó todas las comprobaciones");
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
