"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { readCart, subscribeCart } from "@/lib/cart-client";

export function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const count = useSyncExternalStore(
    subscribeCart,
    () => readCart().reduce((sum, line) => sum + line.quantity, 0),
    () => 0,
  );

  return (
    <Link
      href="/cart"
      onClick={onNavigate}
      aria-label={count ? `Cart, ${count} items` : "Cart"}
      className="relative grid h-10 w-10 place-items-center rounded border border-white/20 text-white hover:bg-white/10"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M7 18a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 18Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM6.2 6l.4 2h13.1l-1.6 7H8.1L6 4H3V2h4l.2 1L6.2 6Z" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-5 text-navy">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
