"use client";

import { FormEvent, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import {
  MIN_HERO_SLIDES,
  defaultHeroSlides,
  parseHeroSlides,
  stringifyHeroSlides,
  type HeroSlide,
} from "@/lib/hero-slides";
import type { SiteSettings } from "@/lib/site-settings";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2";

const fields: { name: keyof SiteSettings; label: string; hint?: string; multiline?: boolean }[] = [
  { name: "heroBadge1", label: "Trust badge 1" },
  { name: "heroBadge2", label: "Trust badge 2" },
  { name: "heroBadge3", label: "Trust badge 3" },
  { name: "featuredHeading", label: "Featured machines heading" },
  { name: "featuredSubheading", label: "Featured machines subheading" },
  { name: "spareHeading", label: "Spare parts heading" },
  { name: "spareSubheading", label: "Spare parts subheading" },
  {
    name: "importHeading",
    label: "Import / export heading",
    hint: "Use a new line for each word, e.g. Import / Export / Global Supply",
    multiline: true,
  },
  { name: "importText", label: "Import / export text", multiline: true },
  { name: "sellTitle", label: "Sell banner title" },
  { name: "sellText", label: "Sell banner text" },
  { name: "sourceTitle", label: "Sourcing banner title" },
  { name: "sourceText", label: "Sourcing banner text" },
  { name: "serviceTitle", label: "Service banner title" },
  { name: "serviceText", label: "Service banner text" },
  {
    name: "brandsLine",
    label: "Trusted brands",
    hint: "Comma-separated list shown on the homepage",
  },
];

const emptySlide: HeroSlide = {
  imageUrl: "",
  title: "",
  subtitle: "",
  brand: "",
  caption: "",
  tagline: "",
};

export function HomepageSettingsForm({ initial }: { initial: SiteSettings }) {
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [values, setValues] = useState({ ...initial });
  const [slides, setSlides] = useState(() => {
    const parsed = parseHeroSlides(initial.heroSlidesJson, []);
    if (parsed.length >= MIN_HERO_SLIDES) {
      return parsed;
    }
    if (initial.heroImageUrl) {
      return [
        { ...defaultHeroSlides[0], imageUrl: initial.heroImageUrl },
        ...defaultHeroSlides.slice(1),
      ];
    }
    return defaultHeroSlides;
  });
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function setField(name: keyof SiteSettings, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updateSlide(index: number, patch: Partial<HeroSlide>) {
    setSlides((current) => current.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)));
  }

  function moveSlide(index: number, direction: number) {
    const next = index + direction;
    if (next < 0 || next >= slides.length) {
      return;
    }
    const copy = [...slides];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setSlides(copy);
  }

  async function onUpload(index: number, file: File) {
    const body = new FormData();
    body.append("files", file);
    const payload = (await adminFetch("/api/admin/uploads", {
      method: "POST",
      body,
    })) as { urls?: string[] };
    const url = payload.urls?.[0];
    if (!url) {
      throw new Error("Upload did not return an image URL");
    }
    updateSlide(index, { imageUrl: url });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const ready = slides.filter((slide) => slide.imageUrl.trim());
    if (ready.length < MIN_HERO_SLIDES) {
      setMessage(`Add at least ${MIN_HERO_SLIDES} slider images before saving.`);
      return;
    }
    setPending(true);
    setMessage("");
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          heroImageUrl: ready[0].imageUrl,
          heroTitle: ready[0].title,
          heroSubtitle: ready[0].subtitle,
          featuredBrand: ready[0].brand,
          featuredCaption: ready[0].caption,
          featuredTagline: ready[0].tagline,
          heroSlidesJson: stringifyHeroSlides(ready),
          heroSliderSeconds: values.heroSliderSeconds,
          ...Object.fromEntries(fields.map((item) => [item.name, values[item.name]])),
        }),
      });
      setMessage("Homepage saved. Open the public site to see the fade slider.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5 rounded-xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-navy">Homepage slider</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add at least {MIN_HERO_SLIDES} slides. They fade automatically on the public homepage.
        </p>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Seconds between slides
          <input
            className={field}
            type="number"
            min={3}
            max={20}
            value={values.heroSliderSeconds}
            onChange={(event) => setField("heroSliderSeconds", event.target.value)}
          />
        </label>
      </div>

      {slides.map((slide, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy">Slide {index + 1}</p>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                onClick={() => moveSlide(index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                onClick={() => moveSlide(index, 1)}
              >
                Down
              </button>
              <button
                type="button"
                disabled={slides.length <= MIN_HERO_SLIDES}
                className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700 disabled:opacity-40"
                onClick={() =>
                  setSlides((current) =>
                    current.length <= MIN_HERO_SLIDES
                      ? current
                      : current.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </button>
            </div>
          </div>
          {slide.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slide.imageUrl} alt="" className="h-36 w-full rounded-xl object-cover" />
          ) : null}
          <button
            type="button"
            onClick={() => fileRefs.current[index]?.click()}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-navy"
          >
            Upload slide photo
          </button>
          <input
            className={field}
            value={slide.imageUrl}
            onChange={(event) => updateSlide(index, { imageUrl: event.target.value })}
            placeholder="Or paste an image URL"
          />
          <input
            ref={(node) => {
              fileRefs.current[index] = node;
            }}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) {
                return;
              }
              setPending(true);
              try {
                await onUpload(index, file);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Upload failed");
              } finally {
                setPending(false);
              }
            }}
          />
          <input
            className={field}
            value={slide.title}
            onChange={(event) => updateSlide(index, { title: event.target.value })}
            placeholder="Slide title"
          />
          <input
            className={field}
            value={slide.subtitle}
            onChange={(event) => updateSlide(index, { subtitle: event.target.value })}
            placeholder="Slide subtitle"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className={field}
              value={slide.brand}
              onChange={(event) => updateSlide(index, { brand: event.target.value })}
              placeholder="Brand"
            />
            <input
              className={field}
              value={slide.caption}
              onChange={(event) => updateSlide(index, { caption: event.target.value })}
              placeholder="Caption"
            />
            <input
              className={field}
              value={slide.tagline}
              onChange={(event) => updateSlide(index, { tagline: event.target.value })}
              placeholder="Tagline"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-navy"
        onClick={() => setSlides((current) => [...current, { ...emptySlide }])}
      >
        Add slider
      </button>

      {fields.map((item) => (
        <label key={item.name} className="block text-sm font-medium text-slate-700">
          {item.label}
          {item.multiline ? (
            <textarea
              className={`${field} min-h-24`}
              value={values[item.name]}
              onChange={(event) => setField(item.name, event.target.value)}
            />
          ) : (
            <input
              className={field}
              value={values[item.name]}
              onChange={(event) => setField(item.name, event.target.value)}
            />
          )}
          {item.hint ? (
            <span className="mt-1 block text-xs font-normal text-slate-500">{item.hint}</span>
          ) : null}
        </label>
      ))}

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save homepage"}
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-navy"
        >
          View live homepage
        </a>
      </div>
    </form>
  );
}
