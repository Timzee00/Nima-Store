"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X, ArrowRight } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
  open: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nima-cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("nima-cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    return {
      items,
      count,
      subtotal,
      add: (item, quantity = 1) =>
        setItems((current) => {
          const existing = current.find((entry) => entry.productId === item.productId);
          if (existing) {
            return current.map((entry) =>
              entry.productId === item.productId
                ? { ...entry, quantity: entry.quantity + quantity }
                : entry
            );
          }
          return [...current, { ...item, quantity }];
        }),
      change: (id, delta) =>
        setItems((current) =>
          current.flatMap((item) => {
            if (item.productId !== id) return [item];
            const quantity = item.quantity + delta;
            return quantity > 0 ? [{ ...item, quantity }] : [];
          })
        ),
      remove: (id) => setItems((current) => current.filter((item) => item.productId !== id)),
      removeMany: (ids) => {
        const blocked = new Set(ids);
        setItems((current) => current.filter((item) => !blocked.has(item.productId)));
      },
      clear: () => setItems([]),
      open: () => setOpen(true),
    };
  }, [items]);

  return (
    <CartContext.Provider value={value}>
      {children}

      <div className={"cart-drawer-wrap " + (isOpen ? "open" : "")}>
        <div className="cart-backdrop" onClick={() => setOpen(false)} />

        <aside className="cart-drawer" aria-label="Shopping bag">
          <div className="cart-head">
            <div>
              <div className="eyebrow">Your bag</div>
              <strong>
                {value.count} {value.count === 1 ? "item" : "items"}
              </strong>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close shopping bag">
              <X size={18} />
            </button>
          </div>

          <div className="cart-items">
            {!value.items.length ? (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--muted)" }}>
                <ShoppingBag size={34} style={{ margin: "0 auto 10px" }} />
                <div>Your bag is waiting.</div>
              </div>
            ) : (
              value.items.map((item) => (
                <div className="cart-item" key={item.productId}>
                  <div className="cart-thumb">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="74px"
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </div>

                  <div>
                    <strong style={{ fontSize: 14 }}>{item.name}</strong>
                    <div className="price">₦{item.price.toLocaleString()}</div>
                    <div className="qty">
                      <button
                        onClick={() => value.change(item.productId, -1)}
                        aria-label={"Decrease quantity of " + item.name}
                      >
                        <Minus size={13} />
                      </button>
                      <span aria-label={"Quantity " + item.quantity}>{item.quantity}</span>
                      <button
                        onClick={() => value.change(item.productId, 1)}
                        aria-label={"Increase quantity of " + item.name}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <button
                    className="icon-btn"
                    style={{ width: 34, height: 34 }}
                    onClick={() => value.remove(item.productId)}
                    aria-label={"Remove " + item.name + " from shopping bag"}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {!!value.items.length && (
            <div className="cart-foot">
              <div className="cart-total">
                <span>Subtotal</span>
                <span>₦{value.subtotal.toLocaleString()}</span>
              </div>

              <div className="drawer-actions">
                <Link className="btn secondary" href="/cart" onClick={() => setOpen(false)}>
                  View bag
                </Link>
                <Link className="btn" href="/checkout" onClick={() => setOpen(false)}>
                  Checkout <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </CartContext.Provider>
  );
}

export function CheckoutForm() {
  const { items, subtotal, clear, removeMany } = useCart();
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

  useEffect(() => {
    let cancelled = false;

    async function validateBag() {
      if (!items.length) {
        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        const response = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: items.map((item) => item.productId) }),
        });

        const data = await response.json();

        if (cancelled) return;
        if (!response.ok) {
          throw new Error(data.error || "We couldn't refresh your bag.");
        }

        const unavailableIds = [
          ...(Array.isArray(data.missingIds) ? data.missingIds : []),
          ...(Array.isArray(data.unavailable)
            ? data.unavailable.map((item: { id: string }) => item.id)
            : []),
        ];

        const uniqueIds = [...new Set(unavailableIds)];

        if (uniqueIds.length) {
          removeMany(uniqueIds);
          setNotice(
            uniqueIds.length === items.length
              ? "Some items in your bag are no longer available. We removed them so you can choose current products."
              : "We refreshed your bag and removed items that are no longer available."
          );
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "We couldn't refresh your bag.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    validateBag();

    return () => {
      cancelled = true;
    };
  }, [items.length, removeMany]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!consent || !items.length) return;

    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

    if (!number) {
      setNotice("WhatsApp ordering is not configured yet. Please contact the store.");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          deliveryAddress: form.address,
          note: form.note,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "We couldn't place your order.");
      }

      const verifiedItems = Array.isArray(data.items) ? data.items : [];
      const verifiedSubtotal = Number(data.subtotal ?? subtotal);

      const lines = [
        "Hello NIMA COLLECTION,",
        "I'd like to place an order:",
        "",
        ...verifiedItems.map(
          (item: { quantity: number; name: string; price: number }) =>
            item.quantity +
            " × " +
            item.name +
            " — ₦" +
            (Number(item.price) * item.quantity).toLocaleString()
        ),
        "",
        "Subtotal: ₦" + verifiedSubtotal.toLocaleString(),
        "Order reference: " + data.orderId,
        "Customer: " + form.name,
        "Phone: " + form.phone,
        "Delivery address: " + form.address,
        ...(form.note ? ["Note: " + form.note] : []),
      ];

      clear();
      window.location.href =
        "https://wa.me/" + number + "?text=" + encodeURIComponent(lines.join("\n"));
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "We couldn't place your order. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <div className="checkout-empty card">
        <div className="eyebrow">Your bag</div>
        <h2>Your bag is empty.</h2>
        <p>Add products before checking out.</p>
        <Link className="btn" href="/shop">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-layout">
      <div className="card checkout-summary">
        <div className="eyebrow">Order summary</div>

        <div className="checkout-products">
          {items.map((item) => (
            <div className="checkout-product" key={item.productId}>
              <div className="checkout-product-image">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="72px"
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                )}
              </div>
              <div>
                <strong>{item.name}</strong>
                <div className="checkout-product-meta">
                  Qty {item.quantity} · ₦{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-total">
          <span>Subtotal</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>

        <p className="checkout-note">
          Delivery fees, where applicable, are confirmed by NIMA COLLECTION before fulfilment.
        </p>
      </div>

      <form className="card checkout-card" onSubmit={submit}>
        <div>
          <div className="eyebrow">Customer details</div>
          <h2>Complete your order.</h2>
        </div>

        <div className="checkout-form">
          <div className="field">
            <label htmlFor="checkout-name">Name</label>
            <input
              id="checkout-name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Full name"
              autoComplete="name"
              minLength={2}
            />
          </div>

          <div className="field">
            <label htmlFor="checkout-phone">Phone</label>
            <input
              id="checkout-phone"
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="080..."
              autoComplete="tel"
              minLength={7}
            />
          </div>

          <div className="field">
            <label htmlFor="checkout-address">Delivery address</label>
            <textarea
              id="checkout-address"
              required
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              rows={3}
              minLength={5}
              placeholder="Where should we deliver?"
              autoComplete="street-address"
            />
          </div>

          <div className="field">
            <label htmlFor="checkout-note">
              Note <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span>
            </label>
            <input
              id="checkout-note"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="Size, colour, special instruction..."
            />
          </div>

          <label className="consent-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span>
              I agree that NIMA COLLECTION may use these details to process this order and
              provide order support. <a href="/privacy">Privacy policy</a>
            </span>
          </label>

          {notice && (
            <div className="site-notice" role="alert">
              <div>
                <strong>NIMA.</strong>
                <span>{notice}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <button className="btn" disabled={busy || checking || !consent}>
            {checking
              ? "Checking your bag..."
              : busy
              ? "Preparing WhatsApp..."
              : "Send order to WhatsApp"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
