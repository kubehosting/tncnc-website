"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { addToCart, readCart, subscribeCart } from "@/lib/cart-client";

export function AddToCartButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const inCart = useSyncExternalStore(
    subscribeCart,
    () => readCart().some((line) => line.slug === slug),
    () => false,
  );
  const className = compact
    ? "rounded-md bg-gold px-2 py-2 text-center text-xs font-bold text-navy hover:bg-gold-hover"
    : "rounded-md bg-gold px-3 py-2 text-center text-sm font-bold text-navy hover:bg-gold-hover";

  if (inCart) {
    return (
      <Link href="/cart" className={className}>
        In cart
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => addToCart(slug)} className={className}>
      Add to Cart
    </button>
  );
}
