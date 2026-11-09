export type CartLine = {
  slug: string;
  quantity: number;
};

export const cartKey = "tncnc-cart";
export const cartEvent = "tncnc-cart-change";

function normalize(parsed: unknown): CartLine[] {
  if (!Array.isArray(parsed)) {
    return [];
  }
  const totals = new Map<string, number>();
  for (const item of parsed) {
    if (typeof item === "string" && item.trim()) {
      totals.set(item, (totals.get(item) ?? 0) + 1);
      continue;
    }
    if (!item || typeof item !== "object" || !("slug" in item) || typeof item.slug !== "string") {
      continue;
    }
    const slug = item.slug.trim();
    const quantity = "quantity" in item ? Number(item.quantity) : 1;
    if (!slug || !Number.isFinite(quantity) || quantity < 1) {
      continue;
    }
    totals.set(slug, (totals.get(slug) ?? 0) + Math.floor(quantity));
  }
  return [...totals].map(([slug, quantity]) => ({ slug, quantity }));
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return normalize(JSON.parse(localStorage.getItem(cartKey) ?? "[]"));
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  localStorage.setItem(cartKey, JSON.stringify(normalize(lines)));
  window.dispatchEvent(new Event(cartEvent));
}

export function addToCart(slug: string, quantity = 1) {
  const lines = readCart();
  const current = lines.find((line) => line.slug === slug);
  if (current) {
    current.quantity += quantity;
  } else {
    lines.push({ slug, quantity });
  }
  writeCart(lines);
}

export function setCartQuantity(slug: string, quantity: number) {
  if (quantity < 1) {
    writeCart(readCart().filter((line) => line.slug !== slug));
    return;
  }
  writeCart(readCart().map((line) => (line.slug === slug ? { slug, quantity } : line)));
}

export function removeFromCart(slug: string) {
  writeCart(readCart().filter((line) => line.slug !== slug));
}

export function clearCart() {
  writeCart([]);
}

export function subscribeCart(onChange: () => void) {
  window.addEventListener(cartEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(cartEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}
