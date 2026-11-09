"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const autoMs = 4000;

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const photos = images.map((image) => image.trim()).filter(Boolean);
  const count = photos.length;
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(count > 1);
  const [paused, setPaused] = useState(false);
  const dragStart = useRef<number | null>(null);
  const current = photos[index] ?? photos[0];

  useEffect(() => {
    setIndex(0);
    setAuto(photos.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [photos.length, name]);

  useEffect(() => {
    if (!auto || paused || count < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, autoMs);
    return () => window.clearInterval(timer);
  }, [auto, paused, count, index]);

  function show(next: number) {
    if (count < 1) {
      return;
    }
    setIndex(((next % count) + count) % count);
  }

  if (!current) {
    return <div className="aspect-[4/3] rounded-xl bg-slate-100" />;
  }

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 shadow-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={(event) => {
          dragStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (dragStart.current == null || count < 2) {
            return;
          }
          const delta = event.clientX - dragStart.current;
          dragStart.current = null;
          if (delta > 40) {
            show(index - 1);
          } else if (delta < -40) {
            show(index + 1);
          }
        }}
      >
        <Image
          src={current}
          alt={`${name} photo ${index + 1} of ${count}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority={index === 0}
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => show(index - 1)}
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-2xl text-navy shadow"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => show(index + 1)}
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-2xl text-navy shadow"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-3 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-semibold text-white">
              {index + 1} / {count}
            </div>
            <button
              type="button"
              onClick={() => setAuto((value) => !value)}
              className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy shadow"
            >
              {auto ? "Auto on" : "Manual"}
            </button>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo}-${photoIndex}`}
              type="button"
              aria-label={`Show photo ${photoIndex + 1}`}
              onClick={() => show(photoIndex)}
              className={`relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-md border-2 bg-slate-100 ${
                photoIndex === index ? "border-navy" : "border-transparent"
              }`}
            >
              <Image src={photo} alt="" fill className="object-cover" sizes="104px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
