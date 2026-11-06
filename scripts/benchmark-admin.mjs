import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
const db = new PrismaClient();
const base = process.env.ADMIN_BENCH_BASE_URL || "https://jhamor.purprum.com";
const output = process.env.ADMIN_BENCH_REPORT || "var/logs/admin-baseline.json";
const routes = [
  "/admin",
  "/admin/productos",
  "/admin/pedidos",
  "/admin/clientes",
  "/admin/media",
  "/admin/configuracion",
  "/admin/historial",
];
let cookie = "";
async function stats() {
  const rows =
    await db.$queryRaw`SELECT coalesce(sum(calls),0)::bigint AS calls,coalesce(sum(total_exec_time),0)::float8 AS ms FROM pg_stat_statements WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND query !~ 'pg_stat_statements' AND query ~ '"(Session|User|Product|Category|Order|Media|Page|Coupon|Audit)"'`;
  return { calls: Number(rows[0].calls), ms: Number(rows[0].ms) };
}
try {
  const login = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });
  if (!login.ok) throw new Error("No se pudo autenticar el verificador.");
  cookie =
    login.headers
      .getSetCookie()
      .find((h) => h.startsWith("jhamor_session="))
      ?.split(";")[0] || "";
  if (!cookie) throw new Error("Sin sesión del verificador.");
  const results = [];
  for (const route of routes) {
    const samples = [];
    for (let n = 0; n < 4; n++) {
      const before = await stats();
      const start = performance.now();
      const response = await fetch(base + route, {
        headers: { Cookie: cookie },
      });
      await response.text();
      const ms = performance.now() - start;
      if (!response.ok) throw new Error(`${route}: ${response.status}`);
      const after = await stats();
      samples.push({
        ms: Math.round(ms * 10) / 10,
        queries: after.calls - before.calls,
        sqlMs: Math.round((after.ms - before.ms) * 100) / 100,
      });
    }
    results.push({ route, cold: samples[0], repeat: samples.slice(1) });
  }
  const report = {
    at: new Date().toISOString(),
    base,
    notes:
      "Read-only complete HTML requests. Each request checks current permissions. Aggregate pg_stat_statements deltas may include concurrent activity; no SQL parameters or response bodies are recorded.",
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
  await db.$disconnect();
}
