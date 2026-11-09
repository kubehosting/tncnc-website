"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

type Hit = {
  slug: string;
  name: string;
  type: string;
  year: string;
  location: string;
  image: string;
};

export function ProductSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setHits([]);
      setPending(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPending(true);
      fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Search failed");
          }
          return response.json() as Promise<{ machines: Hit[] }>;
        })
        .then((payload) => {
          setHits(payload.machines);
          setOpen(true);
          setActive(-1);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setHits([]);
        })
        .finally(() => setPending(false));
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function onSubmit(event: FormEvent) {
    if (query.trim().length < 2) {
      event.preventDefault();
    }
    setOpen(false);
  }

  const showList = open && query.trim().length >= 2;

  return (
    <div ref={box} className="relative">
      <form action="/" method="get" onSubmit={onSubmit} role="search">
        <label htmlFor="product-search" className="mb-2 block text-sm font-bold text-navy">
          Find a machine or spare part
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
              </svg>
            </span>
            <input
              id="product-search"
              name="q"
              value={query}
              autoComplete="off"
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              placeholder="Search by name, brand, model, or location"
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (!showList || hits.length === 0) {
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((value) => (value + 1) % hits.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) => (value - 1 + hits.length) % hits.length);
                } else if (event.key === "Enter" && active >= 0) {
                  event.preventDefault();
                  window.location.href = `/machines/${hits[active].slug}`;
                } else if (event.key === "Escape") {
                  setOpen(false);
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-navy shadow-sm outline-none focus:border-navy"
            />
          </div>
          <button type="submit" className="rounded-lg bg-gold px-4 py-3 text-sm font-bold text-navy hover:bg-gold-hover">
            Search
          </button>
        </div>
      </form>

      {showList ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {pending && hits.length === 0 ? <p className="px-4 py-3 text-sm text-slate-500">Searching…</p> : null}
          {!pending && hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No products match “{query.trim()}”.</p>
          ) : null}
          {hits.map((hit, index) => (
            <Link
              key={hit.slug}
              href={`/machines/${hit.slug}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              className={`flex items-center gap-3 px-3 py-2 ${index === active ? "bg-slate-50" : ""}`}
            >
              <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
                <Image src={hit.image} alt="" fill className="object-cover" sizes="64px" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-navy">{hit.name}</span>
                <span className="block truncate text-xs text-slate-500">
                  {hit.type} · {hit.year} · {hit.location}
                </span>
              </span>
            </Link>
          ))}
          {hits.length > 0 ? (
            <button
              type="submit"
              formAction="/"
              onClick={() => {
                const form = box.current?.querySelector("form");
                form?.requestSubmit();
              }}
              className="block w-full border-t border-slate-100 px-4 py-2 text-left text-sm font-semibold text-navy hover:bg-slate-50"
            >
              See all results for “{query.trim()}”
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
