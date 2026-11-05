import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { AuthForm } from "@/components/forms";
import { currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/shared";
export const metadata = {
  title: "Tu cuenta",
  robots: { index: false, follow: false },
};
export default async function Auth({
  params,
  searchParams,
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { action } = await params;
  if (!["login", "registro"].includes(action)) notFound();
  const next = safeNext((await searchParams).next || null);
  if (await currentUser()) redirect(next);
  const register = action === "registro";
  return (
    <section className="auth-layout">
      <div className="auth-photo">
        <Image
          src="/images/room.webp"
          alt="Un rincón tranquilo de tu futuro hogar"
          fill
          priority
          sizes="50vw"
        />
        <div>
          <p className="eyebrow light">BIENVENIDO A CASA</p>
          <h2>
            Los buenos espacios
            <br />
            empiezan contigo.
          </h2>
        </div>
      </div>
      <div className="auth-form">
        <p className="eyebrow">TU ESPACIO JHAM-OR</p>
        <h1>{register ? "Hagamos espacio." : "Qué bueno verte."}</h1>
        <p className="muted">
          {register
            ? "Crea tu cuenta para realizar pedidos y seguir cada detalle."
            : "Inicia sesión para continuar con tu pedido."}
        </p>
        <AuthForm register={register} next={next} />
      </div>
    </section>
  );
}
