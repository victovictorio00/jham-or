import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, copyFile, access, writeFile, rm } from "node:fs/promises";
const file = process.env.PUBLICATION_FILE || "/app/publication/store.json";
await mkdir("/app/publication", { recursive: true });
try {
  await access(file);
} catch {
  await copyFile("/app/publication-seed.json", file);
}
await rm("/tmp/jhamor-ready", { force: true });
const token = randomBytes(32).toString("hex");
const child = spawn(process.execPath, ["server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    JHAMOR_WARM_TOKEN: token,
    JHAMOR_MANAGED_STARTUP: "1",
  },
});
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    stopping = true;
    child.kill(signal);
  });
child.on("exit", (code) => process.exit(stopping ? 0 : (code ?? 1)));
const base = `http://127.0.0.1:${process.env.PORT || 3012}`;
try {
  let response;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      response = await fetch(base + "/api/internal/prepare", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        signal: AbortSignal.timeout(30000),
      });
      if (response.ok) break;
      if (response.status !== 503)
        throw new Error("Prepare HTTP " + response.status);
    } catch (error) {
      if (attempt === 99) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  if (!response?.ok) throw new Error("No se pudo preparar la publicación.");
  const manifest = await response.json();
  const pending = [...manifest.routes, ...manifest.images];
  const failures = [];
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      for (;;) {
        const path = pending.shift();
        if (!path) return;
        try {
          const r = await fetch(base + path, {
            signal: AbortSignal.timeout(30000),
          });
          await r.arrayBuffer();
          if (!r.ok) failures.push(`${path}: ${r.status}`);
        } catch (e) {
          failures.push(`${path}: ${e.message}`);
        }
      }
    }),
  );
  if (failures.length) throw new Error(failures.join("; "));
  await writeFile("/tmp/jhamor-ready", manifest.version);
  console.log(
    `Publicación lista: ${manifest.routes.length} páginas y ${manifest.images.length} imágenes precargadas.`,
  );
} catch (error) {
  console.error("No se pudo precargar la tienda:", error);
  child.kill("SIGTERM");
  process.exitCode = 1;
}
