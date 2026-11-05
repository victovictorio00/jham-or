"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="section empty">
      <h1>No pudimos cargar este espacio.</h1>
      <p>Vuelve a intentarlo en un momento.</p>
      <button className="button" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
