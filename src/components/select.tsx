"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
type Option = {
  value: string;
  label: string;
  disabled: boolean;
  thumbnail?: string;
};
const plain = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(plain).join("")
      : isValidElement<{ children?: ReactNode }>(node)
        ? plain(node.props.children)
        : "";
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-PE");
export function Select({
  children,
  onChange,
  value,
  defaultValue,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const options: Option[] = Children.toArray(children).flatMap((node) => {
    if (
      !isValidElement<{
        value?: string;
        children?: ReactNode;
        disabled?: boolean;
        "data-thumbnail"?: string;
      }>(node)
    )
      return [];
    return [
      {
        value: String(node.props.value ?? plain(node.props.children)),
        label: plain(node.props.children),
        disabled: Boolean(node.props.disabled),
        thumbnail: node.props["data-thumbnail"],
      },
    ];
  });
  const [uncontrolled, setUncontrolled] = useState(
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selected = String(value ?? uncontrolled),
    chosen = options.find((option) => option.value === selected);
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0),
    [invalid, setInvalid] = useState(false),
    [position, setPosition] = useState<CSSProperties>({});
  const root = useRef<HTMLSpanElement>(null),
    button = useRef<HTMLButtonElement>(null),
    native = useRef<HTMLSelectElement>(null),
    popup = useRef<HTMLDivElement>(null),
    search = useRef<HTMLInputElement>(null);
  const id = useId();
  const label = props["aria-label"] || props.name || "Seleccionar opción";
  const filtered = options.filter((option) =>
    normalized(option.label).includes(normalized(query)),
  );
  const show = () => {
    if (props.disabled) return;
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === selected),
      ),
    );
    setOpen(true);
  };
  const choose = (option: Option) => {
    if (option.disabled) return;
    const control = native.current;
    if (control) {
      control.value = option.value;
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setInvalid(false);
    setOpen(false);
    button.current?.focus();
  };
  useEffect(() => {
    if (selected) setInvalid(false);
  }, [selected]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = root.current!.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) {
        setOpen(false);
        return;
      }
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft || 0,
        topEdge = viewport?.offsetTop || 0;
      const rightEdge = leftEdge + (viewport?.width || innerWidth),
        bottomEdge = topEdge + (viewport?.height || innerHeight);
      const width = Math.min(
        Math.max(rect.width, 240),
        rightEdge - leftEdge - 24,
      );
      const above =
        bottomEdge - rect.bottom < Math.min(240, rect.top - topEdge - 12);
      const anchor = above
        ? Math.min(rect.top, bottomEdge - 12)
        : Math.max(rect.bottom, topEdge + 12);
      setPosition({
        position: "fixed",
        width,
        left: Math.max(
          leftEdge + 12,
          Math.min(rect.left, rightEdge - width - 12),
        ),
        ...(above ? { bottom: innerHeight - anchor + 6 } : { top: anchor + 6 }),
        maxHeight: Math.max(
          80,
          Math.min(
            350,
            above ? anchor - topEdge - 18 : bottomEdge - anchor - 18,
          ),
        ),
        fontFamily: getComputedStyle(root.current!).fontFamily,
      });
    };
    place();
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !popup.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        button.current?.focus();
      }
    };
    const closeOnScroll = (event: Event) => {
      if (!popup.current?.contains(event.target as Node)) place();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", dismiss);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", closeOnScroll, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    if (options.length > 8) search.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", dismiss);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [open, options.length]);
  useEffect(() => {
    if (open)
      popup.current
        ?.querySelector(`[data-option-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  const keys = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        show();
        return;
      }
      let next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? filtered.length - 1
            : Math.max(
                0,
                Math.min(
                  filtered.length - 1,
                  active + (event.key === "ArrowDown" ? 1 : -1),
                ),
              );
      const direction = event.key === "ArrowUp" ? -1 : 1;
      while (filtered[next]?.disabled && next >= 0 && next < filtered.length)
        next += direction;
      setActive(Math.max(0, Math.min(filtered.length - 1, next)));
    } else if (
      event.key === "Enter" ||
      (event.key === " " && event.target !== search.current)
    ) {
      event.preventDefault();
      if (!open) show();
      else if (filtered[active]) choose(filtered[active]);
    } else if (
      !open &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const match = options.find(
        (option) =>
          !option.disabled &&
          normalized(option.label).startsWith(normalized(event.key)),
      );
      if (match) {
        event.preventDefault();
        choose(match);
      }
    }
  };
  return (
    <span
      className={`select-control${invalid ? " is-invalid" : ""}`}
      ref={root}
    >
      <select
        {...props}
        value={selected}
        ref={native}
        tabIndex={-1}
        aria-label={`${label} (control interno)`}
        aria-hidden="true"
        className="select-native"
        onClick={(event) => {
          event.preventDefault();
          show();
          button.current?.focus();
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setInvalid(true);
          button.current?.focus();
        }}
        onChange={(event) => {
          setUncontrolled(event.target.value);
          onChange?.(event);
        }}
      >
        {children}
      </select>
      <button
        ref={button}
        type="button"
        className="select-trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-haspopup="listbox"
        aria-required={props.required || undefined}
        aria-invalid={invalid || props["aria-invalid"] || undefined}
        aria-describedby={props["aria-describedby"]}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        data-value={selected}
        disabled={props.disabled}
        onClick={(event) => {
          event.preventDefault();
          if (open) setOpen(false);
          else show();
        }}
        onKeyDown={keys}
      >
        {chosen?.thumbnail && (
          <img src={chosen.thumbnail} alt="" width={24} height={24} />
        )}
        <span className={!selected ? "select-placeholder" : ""}>
          {chosen?.label || "Selecciona una opción"}
        </span>
        <ChevronDown size={16} />
      </button>
      {open &&
        createPortal(
          <div
            ref={popup}
            className="select-popover"
            style={position}
            onKeyDown={keys}
          >
            {options.length > 8 && (
              <div className="select-search">
                <Search size={16} />
                <input
                  ref={search}
                  aria-label={`Buscar en ${label}`}
                  aria-controls={`${id}-list`}
                  aria-activedescendant={`${id}-option-${active}`}
                  placeholder="Buscar opciones…"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                />
              </div>
            )}
            <div
              className="select-list"
              role="listbox"
              id={`${id}-list`}
              aria-label={label}
            >
              {filtered.map((option, index) => (
                <div
                  role="option"
                  tabIndex={-1}
                  aria-selected={option.value === selected}
                  aria-disabled={option.disabled || undefined}
                  id={`${id}-option-${index}`}
                  data-option-index={index}
                  data-value={option.value}
                  className={`select-option${index === active ? " is-active" : ""}`}
                  key={option.value}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(option)}
                >
                  {option.thumbnail && (
                    <img
                      src={option.thumbnail}
                      alt=""
                      width={38}
                      height={38}
                      loading="lazy"
                    />
                  )}
                  <span>{option.label}</span>
                  {option.value === selected && <Check size={16} />}
                </div>
              ))}
            </div>
            {!filtered.length && (
              <p className="select-empty">No hay opciones que coincidan.</p>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
