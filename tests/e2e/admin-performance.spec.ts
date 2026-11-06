import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());
async function login(page: any) {
  await page.goto("/auth/login?next=/admin/media");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill(process.env.ADMIN_EMAIL);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill(process.env.ADMIN_PASSWORD);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/admin/media");
}
test("multiple photos compress before transfer, bound concurrency and retry only failed uploads", async ({
  page,
}) => {
  await login(page);
  const suffix = randomUUID();
  const names = [0, 1, 2].map((n) => `qa-batch-${suffix}-${n}.png`);
  const buffer = await sharp({
    create: { width: 3000, height: 2000, channels: 3, background: "#a98d76" },
  })
    .png()
    .toBuffer();
  let active = 0,
    maxActive = 0,
    requests = 0,
    rsc = 0;
  const sizes: number[] = [];
  await page.route("**/api/admin/upload", async (route) => {
    const number = ++requests;
    active++;
    maxActive = Math.max(maxActive, active);
    sizes.push(route.request().postDataBuffer()?.length || 0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (number === 1)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Fallo temporal de prueba" }),
      });
    else await route.continue();
    active--;
  });
  page.on("request", (req) => {
    if (
      req.headers().rsc === "1" &&
      new URL(req.url()).pathname.startsWith("/admin")
    )
      rsc++;
  });
  await page
    .locator("input[type=file]")
    .setInputFiles(
      names.map((name) => ({ name, mimeType: "image/png", buffer })),
    );
  await page
    .getByRole("button", { name: "Subir imágenes", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "2 imágenes guardadas. 1 no se pudo subir",
  );
  expect(requests).toBe(3);
  expect(maxActive).toBeLessThanOrEqual(2);
  expect(sizes.every((size) => size < buffer.length * 0.5)).toBe(true);
  await page.getByRole("button", { name: "Reintentar pendientes" }).click();
  await expect(page.getByRole("status")).toHaveText("1 imagen guardada.");
  expect(requests).toBe(4);
  expect(rsc).toBeLessThanOrEqual(2);
  for (const name of names) {
    await expect(
      page.getByRole("article", { name, exact: true }),
    ).toBeVisible();
    const image = await db.media.findFirstOrThrow({ where: { name } });
    expect(image.width).toBe(1600);
    expect(image.thumbnailUrl).toBeTruthy();
    expect(
      (
        await page.request.delete("/api/admin/media/" + image.id, {
          headers: { Origin: "http://localhost:3012" },
        })
      ).status(),
    ).toBe(200);
  }
});
test("cached media list invalidates on writes and never bypasses current permissions", async ({
  page,
  playwright,
}) => {
  await login(page);
  await page.reload();
  const cookie = await page.context().cookies();
  const admin = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: { Origin: "http://localhost:3012" },
    storageState: { cookies: cookie, origins: [] },
  });
  const name = "qa-fresh-" + randomUUID() + ".png";
  const response = await admin.post("/api/admin/upload", {
    multipart: {
      file: {
        name,
        mimeType: "image/png",
        buffer: await sharp({
          create: { width: 20, height: 20, channels: 3, background: "red" },
        })
          .png()
          .toBuffer(),
      },
    },
  });
  expect(response.status()).toBe(201);
  expect(response.headers()["server-timing"]).toContain("process;dur=");
  const image = await response.json();
  await page.reload();
  await expect(page.getByRole("article", { name, exact: true })).toBeVisible();
  expect((await admin.delete("/api/admin/media/" + image.id)).status()).toBe(
    200,
  );
  await page.reload();
  await expect(page.getByRole("article", { name, exact: true })).toHaveCount(0);
  const user = await db.user.findUniqueOrThrow({
    where: { email: process.env.ADMIN_EMAIL },
  });
  const token = randomUUID();
  const { createHash } = await import("node:crypto");
  await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  const context = await playwright.request.newContext({
    baseURL: "http://localhost:3012",
    extraHTTPHeaders: {
      Origin: "http://localhost:3012",
      Cookie: "jhamor_session=" + token,
    },
  });
  expect((await context.get("/api/admin/media-options")).status()).toBe(200);
  await db.session.deleteMany({
    where: { tokenHash: createHash("sha256").update(token).digest("hex") },
  });
  expect((await context.get("/api/admin/media-options")).status()).toBe(401);
  await context.dispose();
  await admin.dispose();
});
