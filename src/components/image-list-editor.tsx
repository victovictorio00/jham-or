"use client";
import Image from "next/image";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Select } from "./select";
type Choice = { url: string; name: string; thumbnailUrl?: string | null };
export function ImageListEditor({
  label,
  name,
  value,
  choices,
  max = 10,
  required = false,
  onChange,
}: {
  label: string;
  name: string;
  value: string[];
  choices: Choice[];
  max?: number;
  required?: boolean;
  onChange: (images: string[]) => void;
}) {
  const move = (index: number, offset: number) => {
    const copy = [...value];
    [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]];
    onChange(copy);
  };
  return (
    <div className="image-list-editor" role="group" aria-label={label}>
      {required && (
        <input
          className="array-required-control"
          name={name}
          aria-label={`${label} (validación)`}
          aria-hidden="true"
          tabIndex={-1}
          required
          value={value.length ? "seleccionado" : ""}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault();
            event.currentTarget.parentElement
              ?.querySelector<HTMLButtonElement>("[role=combobox]")
              ?.focus();
          }}
        />
      )}
      {value.length > 0 && (
        <ol className="image-list-grid">
          {value.map((url, index) => {
            const choice = choices.find((choice) => choice.url === url);
            return (
              <li key={url}>
                <div className="image-list-preview">
                  <Image
                    src={choice?.thumbnailUrl || url}
                    alt={`Imagen ${index + 1} de ${label.toLowerCase()}`}
                    width={220}
                    height={145}
                    sizes="(max-width:600px) 42vw, 180px"
                    unoptimized={Boolean(choice?.thumbnailUrl)}
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <p>{choice?.name || "Imagen guardada"}</p>
                <div className="image-list-actions">
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === 0}
                    aria-label={`Subir imagen ${index + 1}`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={index === value.length - 1}
                    aria-label={`Bajar imagen ${index + 1}`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Quitar imagen ${index + 1}`}
                    onClick={() =>
                      onChange(value.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Select
        aria-label={`Añadir imagen a ${label.toLowerCase()}`}
        value=""
        disabled={value.length >= max}
        onChange={(event) => {
          if (
            event.target.value &&
            !value.includes(event.target.value) &&
            value.length < max
          )
            onChange([...value, event.target.value]);
        }}
      >
        <option value="">
          {value.length >= max
            ? "Has alcanzado el límite"
            : "Selecciona una imagen de la biblioteca…"}
        </option>
        {choices
          .filter((choice) => !value.includes(choice.url))
          .map((choice) => (
            <option
              value={choice.url}
              key={choice.url}
              data-thumbnail={
                choice.thumbnailUrl ||
                `/_next/image?url=${encodeURIComponent(choice.url)}&w=64&q=75`
              }
            >
              {choice.name}
            </option>
          ))}
      </Select>
      <p className="small muted">
        {value.length} de {max} imágenes. El orden de las miniaturas será el
        orden de presentación.
      </p>
    </div>
  );
}
