"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { money, type NavigationGroup } from "@/lib/shared";
export function StoreHeader({
  brand,
  groups,
  count,
}: {
  brand: string;
  groups: NavigationGroup[];
  count: number;
}) {
  const [open, setOpen] = useState(false),
    [preview, setPreview] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const path = usePathname();
  const close = () => {
    setOpen(false);
    setPreview(null);
  };
  useEffect(() => {
    setOpen(false);
    setPreview(null);
  }, [path]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (preview !== null) triggers.current.get(preview)?.focus();
        close();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keys);
    };
  }, [preview]);
  const active = groups.find((group) => group.slug === preview);
  return (
    <header
      className="header has-quick-navigation"
      ref={root}
      onMouseLeave={() => setPreview(null)}
    >
      <button
        className="icon-button mobile-menu"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setPreview(null);
        }}
      >
        {open ? <X /> : <Menu />}
      </button>
      <Link
        href="/"
        className="wordmark"
        aria-label={`${brand}, inicio`}
        onClick={close}
      >
        {brand}
        <small>INTERIORES & MOBILIARIO</small>
      </Link>
      <nav
        className={open ? "nav open" : "nav"}
        aria-label="Navegación principal"
      >
        {groups.map((group) => (
          <div
            className="nav-group"
            key={group.slug}
            onMouseEnter={() => {
              if (matchMedia("(hover:hover) and (pointer:fine)").matches)
                setPreview(group.slug);
            }}
          >
            <Link
              href={group.href}
              prefetch={false}
              onClick={close}
              onFocus={() => setPreview(group.slug)}
              className={preview === group.slug ? "active" : ""}
            >
              {group.name}
            </Link>
            <button
              ref={(el) => {
                if (el) triggers.current.set(group.slug, el);
                else triggers.current.delete(group.slug);
              }}
              type="button"
              className="nav-preview-toggle"
              aria-label={`Mostrar productos de ${group.name}`}
              aria-expanded={preview === group.slug}
              aria-controls="navigation-products"
              onClick={() =>
                setPreview(preview === group.slug ? null : group.slug)
              }
            >
              <ChevronDown size={12} />
            </button>
          </div>
        ))}
        <Link
          href="/nosotros"
          prefetch={false}
          onClick={close}
          onMouseEnter={() => setPreview(null)}
        >
          Nuestra esencia
        </Link>
        {active && (
          <div
            id="navigation-products"
            className="nav-preview-panel"
            aria-label={`Accesos rápidos: ${active.name}`}
          >
            <div className="nav-preview-heading">
              <div>
                <p className="eyebrow">EXPLORA A TU MANERA</p>
                <h2>
                  {active.name === "Colección"
                    ? "Toda la colección"
                    : active.name}
                </h2>
              </div>
              <Link
                href={active.href}
                className="text-link"
                onClick={close}
                prefetch={false}
              >
                Ver{" "}
                {active.name === "Colección"
                  ? "todos los muebles"
                  : "la colección"}{" "}
                <ArrowUpRight size={16} />
              </Link>
              <button
                type="button"
                className="icon-button"
                aria-label="Cerrar accesos rápidos"
                onClick={() => setPreview(null)}
              >
                <X size={18} />
              </button>
            </div>
            {active.products.length ? (
              <div className="nav-preview-grid">
                {active.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/productos/${product.slug}`}
                    className="nav-quick-product"
                    prefetch={false}
                    onClick={close}
                  >
                    <div>
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={240}
                        height={180}
                        sizes="(max-width:850px) 42vw, 14vw"
                      />
                    </div>
                    <h3>{product.name}</h3>
                    <span>{money(product.salePrice ?? product.price)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="nav-preview-empty">
                Pronto encontrarás nuevas piezas en esta colección.
              </p>
            )}
          </div>
        )}
      </nav>
      <div className="header-actions">
        <Link
          href="/mi-cuenta"
          aria-label="Mi cuenta"
          className="icon-button"
          onClick={close}
        >
          <UserRound size={21} />
        </Link>
        <Link
          href="/carrito"
          className="icon-button cart-icon"
          aria-label={`Bolsa, ${count} productos`}
          onClick={close}
        >
          <ShoppingBag size={21} />
          {count > 0 && <b>{count}</b>}
        </Link>
      </div>
    </header>
  );
}
