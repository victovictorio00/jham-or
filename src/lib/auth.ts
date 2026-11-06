import { cache } from "react";
import { AsyncLocalStorage } from "node:async_hooks";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { db } from "./db";
import { redirect } from "next/navigation";
export const cookieName = "jhamor_session";
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
};
const requestAuth = new AsyncLocalStorage<{
  user?: Promise<CurrentUser | null>;
}>();
export function withRequestAuth<T>(work: () => Promise<T>) {
  return requestAuth.run({}, work);
}
async function loadCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  const users = await db.$queryRaw<
    CurrentUser[]
  >`SELECT u."id",u."name",u."email",u."phone",u."role",u."active" FROM "Session" s JOIN "User" u ON u."id"=s."userId" WHERE s."tokenHash"=${hash(token)} AND s."expiresAt">${new Date()} AND u."active"=true LIMIT 1`;
  return users[0] ?? null;
}
export const currentUser = cache(() => {
  const context = requestAuth.getStore();
  if (context) return (context.user ??= loadCurrentUser());
  return loadCurrentUser();
});
export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new AppError(401, "Inicia sesión para continuar.");
  return u;
}
export async function requireAdmin(owner = false) {
  const u = await requireUser();
  if (!["ADMIN", "OWNER"].includes(u.role) || (owner && u.role !== "OWNER"))
    throw new AppError(403, "No tienes permiso para esta acción.");
  return u;
}
export async function adminPage() {
  const u = await currentUser();
  if (!u) redirect("/auth/login?next=/admin");
  if (!["ADMIN", "OWNER"].includes(u.role)) redirect("/mi-cuenta");
  return u;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db.session.create({
    data: { tokenHash: hash(token), userId, expiresAt },
  });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}
export async function rateLimit(key: string, max = 12) {
  const now = new Date();
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,${new Date(Date.now() + 900000)}) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN 1 ELSE "RateLimit"."count"+1 END,"expiresAt"=CASE WHEN "RateLimit"."expiresAt" < ${now} THEN EXCLUDED."expiresAt" ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
  if (rows[0].count > max)
    throw new AppError(
      429,
      "Demasiados intentos. Vuelve a intentarlo en 15 minutos.",
    );
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const expected = process.env.SITE_URL || new URL(req.url).origin;
  if (!origin || origin !== expected)
    throw new AppError(403, "Solicitud no permitida. Recarga la página.");
}
export function failure(e: unknown) {
  if (e instanceof AppError)
    return Response.json({ error: e.message }, { status: e.status });
  if (e && typeof e === "object" && "issues" in e)
    return Response.json(
      {
        error: "Revisa los campos del formulario.",
        details: (e as { issues: unknown }).issues,
      },
      { status: 400 },
    );
  console.error(e);
  return Response.json(
    { error: "No se pudo completar la operación. Inténtalo nuevamente." },
    { status: 500 },
  );
}
