import Link from "next/link";
export default function NotFound() {
  return (
    <main className="section empty">
      <p className="eyebrow">JHAM-OR / 404</p>
      <h1>Esta pieza no está aquí.</h1>
      <p>La página no existe o ya no está disponible.</p>
      <Link className="button" href="/productos">
        Volver a la colección
      </Link>
    </main>
  );
}
