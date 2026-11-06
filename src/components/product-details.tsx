"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Package, ShieldCheck, Truck } from "lucide-react";
import { ProductPurchase } from "./shop";
import { money, type CardProduct } from "@/lib/shared";
export function ProductDetailsBrowser(props: Props) {
  const params = useSearchParams();
  return (
    <ProductDetails
      {...props}
      key={props.product.id + params.get("variante")}
      initialVariantId={params.get("variante") || undefined}
    />
  );
}
type Props = {
  product: CardProduct;
  deliveryArea: string;
  shippingFee: number;
  initialVariantId?: string;
};
export function ProductDetails({
  product: p,
  deliveryArea,
  shippingFee,
  initialVariantId,
}: Props) {
  const variants = p.usesVariants ? p.variants || [] : [];
  const initial =
    variants.find((item) => item.id === initialVariantId) ||
    variants.find((item) => item.stock > 0) ||
    variants[0];
  const [variantId, setVariantId] = useState(initial?.id),
    [photo, setPhoto] = useState(0);
  const variant = variants.find((item) => item.id === variantId);
  const photos = [
    ...new Set(
      [
        variant?.image || p.image,
        ...(variant ? variant.gallery : p.gallery || []),
      ].filter(Boolean),
    ),
  ];
  const selected = variant
    ? {
        ...p,
        image: variant.image,
        price: variant.price,
        salePrice: null,
        stock: variant.stock,
        madeToOrder: false,
        finishes: [],
      }
    : p;
  return (
    <div className="product-detail">
      <div>
        <div className="detail-image">
          <Image
            src={photos[photo] || photos[0]}
            alt={`${p.name}${variant ? " — " + variant.name : ""}, vista ${photo + 1}`}
            fill
            priority
            sizes="(max-width:800px) 95vw, 55vw"
          />
        </div>
        {photos.length > 1 && (
          <div
            className="gallery product-photo-gallery"
            aria-label="Fotos del producto"
          >
            {photos.map((src, index) => (
              <button
                type="button"
                key={src}
                aria-label={`Ver foto ${index + 1}${variant ? " de " + variant.name : ""}`}
                aria-pressed={photo === index}
                onClick={() => setPhoto(index)}
              >
                <Image
                  src={src}
                  alt={`Vista ${index + 1}`}
                  width={150}
                  height={150}
                  sizes="100px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-copy">
        <p className="eyebrow">JHAM-OR / {p.category.name.toUpperCase()}</p>
        <h1>{p.name}</h1>
        <p className="detail-price">
          {money(selected.salePrice ?? selected.price)}
          {!variant && p.salePrice && <del>{money(p.price)}</del>}
        </p>
        <p className="pre-line">{p.description}</p>
        {variants.length > 0 && (
          <fieldset className="detail-variant-picker">
            <legend>
              Elige tu variante{" "}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
            </legend>
            <div>
              {variants.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={variantId === item.id}
                  aria-label={`Elegir variante ${item.name}`}
                  onClick={() => {
                    setVariantId(item.id);
                    setPhoto(0);
                    const url = new URL(location.href);
                    url.searchParams.set("variante", item.id);
                    history.replaceState(null, "", url.pathname + url.search);
                  }}
                >
                  <Image
                    src={item.image}
                    alt=""
                    width={64}
                    height={64}
                    sizes="64px"
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {money(item.price)} ·{" "}
                      {item.stock ? `${item.stock} disponibles` : "Agotado"}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {p.usesVariants && !variant ? (
          <p className="error">No hay variantes disponibles en este momento.</p>
        ) : (
          <ProductPurchase
            key={variant?.id || "base"}
            product={selected}
            variantId={variant?.id}
            variantName={variant?.name}
          />
        )}
        <div className="specs">
          <div>
            <span>Material</span>
            <strong>{p.material}</strong>
          </div>
          <div>
            <span>Medidas</span>
            <strong>{p.dimensions}</strong>
          </div>
          <div>
            <span>Referencia</span>
            <strong>{p.sku}</strong>
          </div>
        </div>
        <div className="detail-benefits">
          <p>
            <Truck size={18} /> Entrega coordinada en {deliveryArea}
          </p>
          <p>
            <Package size={18} /> Envío desde {money(shippingFee)}
          </p>
          <p>
            <ShieldCheck size={18} /> Atención antes y después de tu compra
          </p>
        </div>
      </div>
    </div>
  );
}
