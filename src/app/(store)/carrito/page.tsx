import { CartView } from "@/components/shop";
export const metadata = {
  title: "Tu bolsa",
  robots: { index: false, follow: false },
};
export default function Cart() {
  return (
    <section className="section">
      <div className="page-intro">
        <p className="eyebrow">UN PASO MÁS CERCA DE CASA</p>
        <h1>Tu bolsa.</h1>
      </div>
      <CartView />
    </section>
  );
}
