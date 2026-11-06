"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowUpRight,
  Minus,
  Plus,
  Check,
  ArrowRight,
} from "lucide-react";
import { StoreHeader } from "./store-navigation";
import type { NavigationGroup } from "@/lib/shared";
import { RequiredMark } from "./fields";
import { lowestPrice, CardProduct, CartItem, money } from "@/lib/shared";
type CartContextType = {
  items: CartItem[];
  ready: boolean;
  add: (p: CardProduct, q: number, f: string, variantId?: string) => void;
  setQuantity: (id: string, f: string, q: number, variantId?: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextType>(null!);
export const useCart = () => useContext(CartContext);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("jhamor-cart") || "[]");
      if (Array.isArray(raw))
        setItems(
          raw
            .filter(
              (i: CartItem) =>
                i?.product?.id &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 20 &&
                typeof i.finish === "string",
            )
            .slice(0, 30),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("jhamor-cart", JSON.stringify(items));
  }, [items, ready]);
  const add = (
    product: CardProduct,
    quantity: number,
    finish: string,
    variantId?: string,
  ) =>
    setItems((old) => {
      const existing = old.find(
        (i) =>
          i.product.id === product.id &&
          (variantId
            ? i.variantId === variantId
            : !i.variantId && i.finish === finish),
      );
      return existing
        ? old.map((i) =>
            i === existing
              ? {
                  ...i,
                  product,
                  finish,
                  quantity: Math.min(
                    product.madeToOrder ? 20 : Math.min(20, product.stock),
                    i.quantity + quantity,
                  ),
                }
              : i,
          )
        : [
            ...old,
            { product, quantity, finish, ...(variantId ? { variantId } : {}) },
          ].slice(0, 30);
    });
  return (
    <CartContext.Provider
      value={{
        items,
        ready,
        add,
        setQuantity: (id, f, q, variantId) =>
          setItems((old) =>
            q <= 0
              ? old.filter(
                  (i) =>
                    i.product.id !== id ||
                    i.finish !== f ||
                    i.variantId !== variantId,
                )
              : old.map((i) =>
                  i.product.id === id &&
                  i.finish === f &&
                  i.variantId === variantId
                    ? { ...i, quantity: Math.min(20, q) }
                    : i,
                ),
          ),
        clear: () => setItems([]),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function Header({
  brand,
  groups,
}: {
  brand: string;
  groups: NavigationGroup[];
}) {
  const { items } = useCart();
  return (
    <StoreHeader
      brand={brand}
      groups={groups}
      count={items.reduce((total, item) => total + item.quantity, 0)}
    />
  );
}
export function ProductCard({
  product: p,
  priority = false,
}: {
  product: CardProduct;
  priority?: boolean;
}) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const variants = p.usesVariants ? p.variants || [] : [];
  const variant = variants.find((variant) => variant.id === variantId);
  const href = `/productos/${p.slug}${variant ? "?variante=" + variant.id : ""}`;
  return (
    <article className="product-card" onMouseLeave={() => setVariantId(null)}>
      <div className="product-image-wrap">
        <Link href={href} prefetch={false} className="product-image">
          <Image
            src={variant?.image || p.image}
            alt={variant ? `${p.name} — ${variant.name}` : p.name}
            fill
            sizes="(max-width:600px) 44vw, (max-width:1000px) 45vw, 28vw"
            priority={priority}
          />
          {!variants.length &&
            (p.salePrice ? (
              <span className="badge">Selección especial</span>
            ) : p.madeToOrder ? (
              <span className="badge">Hecho para ti</span>
            ) : null)}
          <span className="product-arrow">
            <ArrowUpRight size={22} />
          </span>
        </Link>
        {variants.length > 0 && (
          <div
            className="product-variant-strip"
            aria-label={`Variantes de ${p.name}`}
          >
            {variants.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-label={`Ver variante ${item.name} de ${p.name}`}
                title={`${item.name} · ${money(item.price)}${item.stock ? "" : " · Agotado"}`}
                aria-pressed={variantId === item.id}
                onMouseEnter={() => setVariantId(item.id)}
                onFocus={() => setVariantId(item.id)}
                onClick={() => setVariantId(item.id)}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  width={44}
                  height={44}
                  sizes="44px"
                />
                <span className="variant-thumb-caption">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="product-meta">
        {p.category.name}
        <span>{variant?.name || p.material}</span>
      </div>
      <Link href={href} prefetch={false}>
        <h3>{p.name}</h3>
      </Link>
      <p className="product-price">
        {variants.length && !variant && <span>Desde </span>}
        {money(variant?.price ?? lowestPrice(p))}
        {!variants.length && p.salePrice && <del>{money(p.price)}</del>}
      </p>
    </article>
  );
}
export function ProductPurchase({
  product: p,
  variantId,
  variantName,
}: {
  product: CardProduct;
  variantId?: string;
  variantName?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState(p.finishes[0] || "");
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const max = p.madeToOrder ? 20 : Math.min(20, p.stock);
  return (
    <div className="purchase">
      {!variantId && p.finishes.length > 0 && (
        <fieldset>
          <legend>
            Acabado
            <RequiredMark /> <span>— {finish}</span>
          </legend>
          <div className="finish-options">
            {p.finishes.map((f) => (
              <button
                type="button"
                key={f}
                aria-pressed={finish === f}
                className={finish === f ? "selected" : ""}
                onClick={() => {
                  setFinish(f);
                  setAdded(false);
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="purchase-row">
        <div className="quantity">
          <button
            aria-label="Reducir cantidad"
            disabled={quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            <Minus size={16} />
          </button>
          <span>{quantity}</span>
          <button
            aria-label="Aumentar cantidad"
            disabled={quantity >= max}
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          className="button"
          disabled={max === 0}
          onClick={() => {
            add(p, quantity, variantName ?? finish, variantId);
            setAdded(true);
          }}
        >
          {max === 0 ? (
            "Agotado"
          ) : added ? (
            <>
              <Check size={18} /> Añadido a tu bolsa
            </>
          ) : (
            <>
              Añadir a la bolsa <ShoppingBag size={18} />
            </>
          )}
        </button>
      </div>
      {added && (
        <Link href="/carrito" className="text-link">
          Ver mi bolsa <ArrowRight size={16} />
        </Link>
      )}
      <p className="muted small">
        {p.madeToOrder
          ? `Fabricado a pedido · Plazo estimado: ${p.leadDays} días`
          : `${p.stock} disponibles · Preparación estimada: ${p.leadDays} días`}
      </p>
    </div>
  );
}
export function CartView() {
  const { items, ready, setQuantity } = useCart();
  if (!ready) return <p>Cargando tu bolsa…</p>;
  if (!items.length)
    return (
      <div className="empty">
        <ShoppingBag size={42} />
        <h2>Un espacio para tus favoritos.</h2>
        <p>Encuentra esa pieza que hará tu hogar más tuyo.</p>
        <Link className="button" href="/productos">
          Explorar la colección <ArrowRight size={18} />
        </Link>
      </div>
    );
  const total = items.reduce(
    (t, i) => t + (i.product.salePrice ?? i.product.price) * i.quantity,
    0,
  );
  return (
    <div className="cart-layout">
      <div>
        {items.map((i) => (
          <article
            className="cart-line"
            key={i.product.id + (i.variantId || i.finish)}
          >
            <Link href={`/productos/${i.product.slug}`}>
              <Image
                src={i.product.image}
                alt={i.product.name}
                width={140}
                height={140}
              />
            </Link>
            <div>
              <Link href={`/productos/${i.product.slug}`}>
                <h3>{i.product.name}</h3>
              </Link>
              <p className="muted">{i.finish || i.product.material}</p>
              <p>{money(i.product.salePrice ?? i.product.price)}</p>
              <div className="quantity">
                <button
                  aria-label={`Quitar una unidad de ${i.product.name}`}
                  onClick={() =>
                    setQuantity(
                      i.product.id,
                      i.finish,
                      i.quantity - 1,
                      i.variantId,
                    )
                  }
                >
                  <Minus size={14} />
                </button>
                <span>{i.quantity}</span>
                <button
                  aria-label={`Añadir una unidad de ${i.product.name}`}
                  disabled={
                    i.quantity >=
                    (i.product.madeToOrder ? 20 : Math.min(20, i.product.stock))
                  }
                  onClick={() =>
                    setQuantity(
                      i.product.id,
                      i.finish,
                      i.quantity + 1,
                      i.variantId,
                    )
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="cart-end">
              <strong>
                {money((i.product.salePrice ?? i.product.price) * i.quantity)}
              </strong>
              <button
                className="text-button"
                onClick={() =>
                  setQuantity(i.product.id, i.finish, 0, i.variantId)
                }
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
      <aside className="summary">
        <h2>Tu selección</h2>
        <div className="total-row">
          <span>Subtotal</span>
          <strong>{money(total)}</strong>
        </div>
        <p className="muted small">
          El envío y los descuentos se calculan al finalizar. Confirmaremos
          precios y disponibilidad antes de registrar el pedido.
        </p>
        <Link href="/checkout" className="button">
          Continuar con mi pedido <ArrowRight size={18} />
        </Link>
        <p className="small muted">
          Para comprar necesitarás iniciar sesión o crear una cuenta.
        </p>
        <Link href="/productos" className="text-link">
          Seguir explorando
        </Link>
      </aside>
    </div>
  );
}
