"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isOptimizedImage, type HeroSlide } from "@/lib/hero-slides";
import { whatsappLink } from "@/lib/catalog";

export function HomeHeroSlider({
  slides,
  badges,
  intervalMs,
}: {
  slides: HeroSlide[];
  badges: string[];
  intervalMs: number;
}) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const current = slides[index] ?? slides[0];

  useEffect(() => {
    if (count < 2) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [count, intervalMs]);

  if (!current) {
    return null;
  }

  function go(delta: number) {
    setIndex((value) => (value + delta + count) % count);
  }

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {slides.map((slide, slideIndex) => (
        <div
          key={`${slide.imageUrl}-${slideIndex}`}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            slideIndex === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            priority={slideIndex === 0}
            unoptimized={!isOptimizedImage(slide.imageUrl)}
            className="object-cover object-[70%_center] opacity-50"
            sizes="100vw"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/88 to-navy/15" />
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/25 text-xl md:grid"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/25 text-xl md:grid"
      >
        ›
      </button>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-6 lg:py-24">
        <div>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {current.title}
          </h1>
          <p className="mt-4 text-sm font-medium text-white/85">{current.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/90">
            {badges.map((badge, badgeIndex) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1.5"
              >
                {badgeIndex === 0 ? <span className="text-gold">★</span> : null}
                {badge}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/used-machines"
              className="rounded bg-gold px-5 py-3 text-sm font-bold text-navy hover:bg-gold-hover"
            >
              View Machines →
            </Link>
            <Link
              href="/sell"
              className="rounded border border-white/50 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Sell Your Machine
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded bg-[#25d366] px-5 py-3 text-sm font-semibold"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
        <aside className="hidden self-end justify-self-end text-right md:block">
          <p className="text-2xl font-black tracking-wide">{current.brand}</p>
          <p className="mt-1 text-sm text-white/85">{current.caption}</p>
          <p className="text-xs text-white/70">{current.tagline}</p>
        </aside>
      </div>
      <div className="relative z-10 flex justify-center gap-2 pb-6">
        {slides.map((slide, slideIndex) => (
          <button
            key={`dot-${slide.imageUrl}-${slideIndex}`}
            type="button"
            aria-label={`Show slide ${slideIndex + 1}`}
            onClick={() => setIndex(slideIndex)}
            className={`h-2.5 rounded-full transition-all ${
              slideIndex === index ? "w-8 bg-gold" : "w-2.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
