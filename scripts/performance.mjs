import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
const db = new PrismaClient();
const base = process.env.PERF_BASE_URL || "http://localhost:3012";
const paths = [
  "/",
  "/productos",
  "/productos/sofa-olivo",
  "/nosotros",
  "/paginas/terminos",
  "/productos?q=" + randomUUID(),
  "/productos?categoria=sala&orden=price-asc",
];
async function count() {
  const rows =
    await db.$queryRaw`SELECT coalesce(sum(calls),0)::bigint AS calls FROM pg_stat_statements WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND query ~ '(FROM|JOIN) "public"."(Product|ProductVariant|Category|Setting|Page|PublicationState)"'`;
  return Number(rows[0].calls);
}
async function visit(path) {
  const start = performance.now();
  const r = await fetch(base + path);
  await r.text();
  if (!r.ok) throw new Error(path + ": " + r.status);
  return {
    ms: performance.now() - start,
    cache: r.headers.get("x-nextjs-cache"),
  };
}
try {
  const results = [];
  for (const path of paths) {
    const before = await count();
    const responses = [];
    for (let i = 0; i < 15; i++) responses.push(await visit(path));
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const after = await count();
    const times = responses.map((r) => r.ms).sort((a, b) => a - b);
    results.push({
      path,
      requests: 15,
      additionalPublicQueries: after - before,
      cacheStatuses: [...new Set(responses.map((r) => r.cache))],
      p50ms: Math.round(times[7] * 10) / 10,
      p95ms: Math.round(times[14] * 10) / 10,
    });
  }
  const report = {
    at: new Date().toISOString(),
    base,
    notes:
      "Complete HTML requests from this server, including the first request of each measured URL and a never-seen search. Routes were preloaded by server startup, not by this verifier. Public SQL includes Product, ProductVariant, Category, Setting, Page and PublicationState. Private operations and SELECT 1 health checks are excluded.",
    results,
  };
  await writeFile(
    "docs/performance.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (results.some((r) => r.additionalPublicQueries !== 0))
    process.exitCode = 1;
} finally {
  await db.$disconnect();
}
