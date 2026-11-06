"use client";
import { Plus, Trash2 } from "lucide-react";
import { ImageListEditor } from "./image-list-editor";
import { RequiredMark } from "./fields";
import type { ProductVariant } from "@/lib/shared";
export function VariantEditor({
  value,
  choices,
  onChange,
}: {
  value: ProductVariant[];
  choices: { url: string; name: string; thumbnailUrl?: string | null }[];
  onChange: (value: ProductVariant[]) => void;
}) {
  const update = (id: string, patch: Partial<ProductVariant>) =>
    onChange(
      value.map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    );
  return (
    <div className="variant-editor">
      <p className="small muted">
        Cada variante tiene su propio precio, stock y fotos. Las variantes
        retiradas se conservan para los pedidos anteriores.
      </p>
      {value.map((variant, index) => (
        <fieldset className="variant-editor-card" key={variant.id}>
          <legend>Variante {index + 1}</legend>
          <div className="variant-editor-heading">
            <strong>{variant.name || "Nueva variante"}</strong>
            <button
              type="button"
              className="text-button danger-text"
              aria-label={`Quitar variante ${index + 1}`}
              onClick={() =>
                onChange(value.filter((item) => item.id !== variant.id))
              }
            >
              <Trash2 size={15} /> Quitar
            </button>
          </div>
          <div className="variant-editor-fields">
            <label>
              Nombre o acabado
              <RequiredMark />
              <input
                name={`variant-${index}-name`}
                aria-label={`Nombre de variante ${index + 1}`}
                value={variant.name}
                required
                maxLength={100}
                onChange={(event) =>
                  update(variant.id, { name: event.target.value })
                }
              />
            </label>
            <label>
              Precio (S/)
              <RequiredMark />
              <input
                name={`variant-${index}-price`}
                aria-label={`Precio de variante ${index + 1} (S/)`}
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                value={variant.price ? variant.price / 100 : ""}
                required
                onChange={(event) =>
                  update(variant.id, {
                    price: Math.round(Number(event.target.value) * 100),
                  })
                }
              />
            </label>
            <label>
              Unidades disponibles
              <RequiredMark />
              <input
                name={`variant-${index}-stock`}
                aria-label={`Stock de variante ${index + 1}`}
                type="number"
                min={0}
                max={100000}
                step={1}
                value={variant.stock}
                required
                onChange={(event) =>
                  update(variant.id, { stock: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <p className="variant-photos-title">
            Fotos de esta variante
            <RequiredMark />
          </p>
          <ImageListEditor
            label={`Fotos de variante ${index + 1}`}
            name={`variant-${index}-photos`}
            value={[
              ...new Set([variant.image, ...variant.gallery].filter(Boolean)),
            ]}
            choices={choices}
            max={10}
            required
            onChange={(images) =>
              update(variant.id, {
                image: images[0] || "",
                gallery: images.slice(1),
              })
            }
          />
        </fieldset>
      ))}
      <button
        type="button"
        className="button outline"
        disabled={value.length >= 20}
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              name: "",
              price: 0,
              stock: 0,
              image: "",
              gallery: [],
            },
          ])
        }
      >
        <Plus size={17} /> Añadir variante
      </button>
    </div>
  );
}
