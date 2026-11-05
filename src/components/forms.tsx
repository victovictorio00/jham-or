"use client";
import { useState, FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useCart } from "./shop";
import { money, safeNext, Settings, statuses } from "@/lib/shared";
export async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "No se pudo completar la solicitud.");
  return data;
}
export function PasswordField({
  label = "Contraseña",
  name = "password",
  required = true,
  minLength = 12,
  autoComplete = "new-password",
}: {
  label?: string;
  name?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label>
      {label}
      <div className="password-field">
        <input
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={128}
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}
export function AuthForm({
  register,
  next,
}: {
  register: boolean;
  next: string;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (register && data.password !== data.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await request(
        `/api/auth/${register ? "register" : "login"}`,
        "POST",
        data,
      );
      router.push(safeNext(next));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="stack-form">
      {register && (
        <>
          <label>
            Nombre completo
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={150}
            />
          </label>
          <label>
            Teléfono
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={30}
            />
          </label>
        </>
      )}
      <label>
        Correo electrónico
        <input
          type="email"
          name="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      <PasswordField
        minLength={register ? 12 : 1}
        autoComplete={register ? "new-password" : "current-password"}
      />
      {register && (
        <>
          <p className="small muted">Usa al menos 12 caracteres.</p>
          <PasswordField label="Repite la contraseña" name="confirm" />
          <p className="small muted">
            Al crear tu cuenta aceptas los{" "}
            <Link href="/paginas/terminos">términos</Link> y la{" "}
            <Link href="/paginas/privacidad">política de privacidad</Link>.
          </p>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Un momento…" : register ? "Crear mi cuenta" : "Iniciar sesión"}
        <ArrowRight size={18} />
      </button>
      <p className="small">
        {register ? "¿Ya tienes cuenta?" : "¿Primera vez por aquí?"}{" "}
        <Link
          className="underlined"
          href={`/auth/${register ? "login" : "registro"}?next=${encodeURIComponent(next)}`}
        >
          {register ? "Inicia sesión" : "Crea tu cuenta"}
        </Link>
      </p>
    </form>
  );
}
export function Logout() {
  const router = useRouter();
  return (
    <button
      className="text-button"
      onClick={async () => {
        await request("/api/auth/logout", "POST");
        router.push("/");
        router.refresh();
      }}
    >
      Cerrar sesión
    </button>
  );
}
export function ProfileForm({
  user,
}: {
  user: { name: string; phone: string };
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="stack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fields = Object.fromEntries(new FormData(form));
        if (!fields.password) {
          delete fields.password;
          delete fields.currentPassword;
        }
        setBusy(true);
        try {
          await request("/api/account", "PATCH", fields);
          setMessage("Datos actualizados.");
          router.refresh();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Nombre
        <input name="name" defaultValue={user.name} required minLength={2} />
      </label>
      <label>
        Teléfono
        <input name="phone" defaultValue={user.phone} required minLength={7} />
      </label>
      <details>
        <summary>Cambiar contraseña</summary>
        <PasswordField
          label="Contraseña actual"
          name="currentPassword"
          autoComplete="current-password"
          minLength={1}
          required={false}
        />
        <PasswordField
          label="Nueva contraseña (12 caracteres como mínimo)"
          required={false}
        />
      </details>
      <button className="button" disabled={busy}>
        {busy ? "Guardando…" : "Guardar datos"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function CheckoutForm({
  settings: s,
  user,
}: {
  settings: Settings;
  user: { name: string; phone: string };
}) {
  const { items, ready, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState("DELIVERY");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<{
    subtotal: number;
    discount: number;
    code: string;
  } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [key] = useState(() =>
    typeof crypto !== "undefined" ? crypto.randomUUID() : "",
  );
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();
  const subtotal = items.reduce(
    (t, i) => t + (i.product.salePrice ?? i.product.price) * i.quantity,
    0,
  );
  if (!ready) return <p>Cargando tu selección…</p>;
  if (confirmed) return <p>Abriendo tu pedido…</p>;
  if (!items.length)
    return (
      <div className="empty">
        <h2>Tu bolsa está vacía.</h2>
        <Link href="/productos" className="button">
          Explorar muebles
        </Link>
      </div>
    );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (coupon && !quote) {
      setError("Aplica el cupón o elimina el código antes de confirmar.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = {
        ...Object.fromEntries(new FormData(e.currentTarget)),
        delivery,
        idempotencyKey: key,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          finish: i.finish,
        })),
      };
      const order = await request("/api/orders", "POST", body);
      setConfirmed(true);
      clear();
      router.push(`/mi-cuenta/pedidos/${order.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="cart-layout" onSubmit={submit}>
      <div className="stack-form">
        <h2>Datos de entrega</h2>
        <div className="form-grid">
          <label>
            Nombre de quien recibe
            <input
              name="name"
              defaultValue={user.name}
              required
              minLength={2}
              maxLength={150}
            />
          </label>
          <label>
            Teléfono de contacto
            <input
              name="phone"
              type="tel"
              defaultValue={user.phone}
              required
              minLength={7}
              maxLength={30}
            />
          </label>
        </div>
        <label>
          Modalidad
          <select
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          >
            <option value="DELIVERY">Envío — {s.deliveryArea}</option>
            {s.pickupAddress && (
              <option value="PICKUP">Recojo en tienda</option>
            )}
          </select>
        </label>
        {delivery === "DELIVERY" ? (
          <>
            <label>
              Dirección completa
              <input
                name="address"
                required
                minLength={5}
                maxLength={500}
                autoComplete="street-address"
              />
            </label>
            <label>
              Distrito
              <input name="district" required minLength={2} maxLength={150} />
            </label>
            <p className="small muted">
              Cobertura: {s.deliveryArea}. El plazo de cada mueble se muestra en
              su ficha; coordinaremos la fecha contigo.
            </p>
          </>
        ) : (
          <p>
            Dirección de recojo: {s.pickupAddress}
            <input name="address" type="hidden" value="" />
            <input name="district" type="hidden" value="" />
          </p>
        )}
        <h2>Preferencia de pago</h2>
        <label>
          Método
          <select name="payment">
            <option value="TRANSFER">Transferencia bancaria</option>
            <option value="YAPE">Yape</option>
            <option value="CASH">Efectivo a coordinar</option>
          </select>
        </label>
        <p className="small muted">
          Registraremos tu pedido pendiente de confirmación. El equipo
          coordinará contigo la entrega y las instrucciones de pago. Este
          formulario no realiza un cobro.
        </p>
        <label>
          Indicaciones adicionales
          <textarea name="notes" maxLength={2000} rows={3} />
        </label>
        <label>
          Código de descuento
          <input
            name="coupon"
            maxLength={30}
            placeholder="Si tienes un cupón"
            value={coupon}
            onChange={(e) => {
              setCoupon(e.target.value.trim().toUpperCase());
              setQuote(null);
            }}
          />
        </label>
        {coupon && (
          <button
            type="button"
            className="button outline"
            disabled={quoting || busy}
            onClick={async () => {
              setQuoting(true);
              setError("");
              try {
                setQuote(
                  await request("/api/quote", "POST", {
                    coupon,
                    items: items.map((i) => ({
                      productId: i.product.id,
                      quantity: i.quantity,
                    })),
                  }),
                );
              } catch (e) {
                setQuote(null);
                setError((e as Error).message);
              } finally {
                setQuoting(false);
              }
            }}
          >
            {quoting
              ? "Validando…"
              : quote
                ? "Cupón aplicado"
                : "Aplicar cupón"}
          </button>
        )}
        <label className="checkbox">
          <input type="checkbox" required />
          Acepto los{" "}
          <Link href="/paginas/terminos" target="_blank">
            términos de compra
          </Link>
          .
        </label>
      </div>
      <aside className="summary">
        <h2>Tu pedido</h2>
        {items.map((i) => (
          <div className="checkout-line" key={i.product.id + i.finish}>
            <span>
              {i.product.name} × {i.quantity}
              <small>{i.finish}</small>
            </span>
            <strong>
              {money((i.product.salePrice ?? i.product.price) * i.quantity)}
            </strong>
          </div>
        ))}
        <div className="total-row">
          <span>Subtotal</span>
          <span>{money(quote?.subtotal ?? subtotal)}</span>
        </div>
        <div className="total-row">
          <span>Entrega</span>
          <span>{money(delivery === "DELIVERY" ? s.shippingFee : 0)}</span>
        </div>
        <div className="total-row grand">
          <span>Total</span>
          <strong>
            {money(
              (quote?.subtotal ?? subtotal) +
                (delivery === "DELIVERY" ? s.shippingFee : 0) -
                (quote?.discount ?? 0),
            )}
          </strong>
        </div>
        {quote && (
          <p className="success" role="status">
            Cupón {quote.code}: ahorras {money(quote.discount)}.
          </p>
        )}
        <p className="muted small">
          El servidor valida el cupón y el importe definitivo al confirmar.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Confirmando…" : "Confirmar mi pedido"}
          <ArrowRight size={18} />
        </button>
      </aside>
    </form>
  );
}
