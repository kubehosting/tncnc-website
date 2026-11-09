"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const photos = images.length ? images : [];
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? photos[0];

  if (!current) {
    return <div className="aspect-[4/3] rounded-lg bg-slate-100" />;
  }

  function show(next: number) {
    if (!photos.length) {
      return;
    }
    setIndex((next + photos.length) % photos.length);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 shadow-sm">
        <Image
          src={current}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
        />
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => show(index - 1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-navy shadow"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => show(index + 1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-navy shadow"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {photos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo}-${photoIndex}`}
              type="button"
              onClick={() => setIndex(photoIndex)}
              className={`relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-md border-2 bg-slate-100 ${
                photoIndex === index ? "border-navy" : "border-transparent"
              }`}
            >
              <Image src={photo} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
