import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const base = process.env.UPLOAD_BENCH_BASE_URL || "http://localhost:3012";
if (
  new URL(base).hostname !== "localhost" &&
  new URL(base).hostname !== "127.0.0.1"
)
  throw new Error("Solo se permite crear imágenes sintéticas en QA local.");
const output =
  process.env.UPLOAD_BENCH_REPORT || "var/logs/upload-baseline.json";
let cookie = "";
try {
  const login = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  if (!login.ok) throw new Error("Login falló");
  cookie =
    login.headers
      .getSetCookie()
      .find((h) => h.startsWith("jhamor_session="))
      ?.split(";")[0] || "";
  const source = await sharp("public/images/hero.webp")
    .resize(3000, 2000, { fit: "cover" })
    .jpeg({ quality: 95 })
    .toBuffer();
  const small = await sharp(source)
    .resize(1600, 1600, { fit: "inside" })
    .webp({ quality: 82 })
    .toBuffer();
  const results = [];
  for (const [label, bytes] of [
    ["original", source],
    ["prepared", small],
  ]) {
    for (let n = 0; n < 3; n++) {
      const form = new FormData();
      form.append(
        "file",
        new File([bytes], "qa-upload-benchmark.jpg", {
          type: label === "original" ? "image/jpeg" : "image/webp",
        }),
      );
      const start = performance.now();
      const response = await fetch(base + "/api/admin/upload", {
        method: "POST",
        headers: { Origin: base, Cookie: cookie },
        body: form,
      });
      const image = await response.json();
      if (!response.ok) throw new Error(image.error || "Upload falló");
      results.push({
        input: label,
        bytes: bytes.length,
        ms: Math.round((performance.now() - start) * 10) / 10,
        serverTiming: response.headers.get("server-timing"),
        storedBytes: image.size,
      });
      const deletion = await fetch(base + "/api/admin/media/" + image.id, {
        method: "DELETE",
        headers: { Origin: base, Cookie: cookie },
      });
      if (!deletion.ok) throw new Error("No se pudo retirar la muestra");
    }
  }
  const report = {
    at: new Date().toISOString(),
    base,
    notes:
      "Local QA only, three sequential samples per input; source is a public sample expanded to 3000×2000 JPEG. Prepared input approximates browser compression, whose actual transfer is separately tested in Playwright. Not an internet bandwidth measurement.",
    results,
  };
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (cookie)
    await fetch(base + "/api/auth/logout", {
      method: "POST",
      headers: { Origin: base, Cookie: cookie },
    }).catch(() => {});
}
