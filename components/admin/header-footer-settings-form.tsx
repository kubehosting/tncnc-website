"use client";

import { FormEvent, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { mediaUrl } from "@/lib/media-url";
import { parseNav, stringifyNav, type NavItem } from "@/lib/site-nav";
import type { SiteSettings } from "@/lib/site-settings";

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-gold focus:ring-2";

function MenuEditor({
  title,
  hint,
  items,
  onChange,
}: {
  title: string;
  hint: string;
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}) {
  function update(index: number, patch: Partial<NavItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, direction: number) {
    const next = index + direction;
    if (next < 0 || next >= items.length) {
      return;
    }
    const copy = [...items];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      {items.map((item, index) => (
        <div key={`${index}-${item.href}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className={field}
            value={item.label}
            placeholder="Label"
            onChange={(event) => update(index, { label: event.target.value })}
          />
          <input
            className={field}
            value={item.href}
            placeholder="/page"
            onChange={(event) => update(index, { href: event.target.value })}
          />
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              onClick={() => move(index, -1)}
            >
              Up
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              onClick={() => move(index, 1)}
            >
              Down
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-navy"
        onClick={() => onChange([...items, { label: "New page", href: "/" }])}
      >
        Add menu item
      </button>
    </div>
  );
}

export function HeaderFooterSettingsForm({ initial }: { initial: SiteSettings }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({ ...initial });
  const [headerMenu, setHeaderMenu] = useState(() => parseNav(initial.headerMenuJson));
  const [footerMenu, setFooterMenu] = useState(() =>
    parseNav(initial.footerMenuJson, parseNav(initial.headerMenuJson)),
  );
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function setField(name: keyof SiteSettings, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function onUpload(file: File) {
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
    setField("logoUrl", url);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          logoUrl: values.logoUrl,
          headerCtaLabel: values.headerCtaLabel,
          headerCtaHref: values.headerCtaHref,
          headerMenuJson: stringifyNav(headerMenu.filter((item) => item.label && item.href)),
          footerMenuJson: stringifyNav(footerMenu.filter((item) => item.label && item.href)),
          footerBlurb: values.footerBlurb,
          footerQuickLinksHeading: values.footerQuickLinksHeading,
          footerLocationHeading: values.footerLocationHeading,
          footerFollowHeading: values.footerFollowHeading,
          footerSubscribeHeading: values.footerSubscribeHeading,
          footerSubscribeText: values.footerSubscribeText,
          footerCopyright: values.footerCopyright,
          footerBottomLine: values.footerBottomLine,
          companyName: values.companyName,
          tagline: values.tagline,
          phone: values.phone,
          email: values.email,
          address: values.address,
          website: values.website,
          instagram: values.instagram,
          linkedin: values.linkedin,
          youtube: values.youtube,
        }),
      });
      setMessage("Header and footer saved. Refresh the public site to see the change.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8 rounded-xl bg-white p-5 shadow-sm">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-navy">Header</h2>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Logo</p>
          {values.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(values.logoUrl)} alt="" className="mb-3 h-12 w-auto rounded bg-navy p-2" />
          ) : null}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-navy"
          >
            Upload logo
          </button>
          <input
            className={field}
            value={values.logoUrl}
            onChange={(event) => setField("logoUrl", event.target.value)}
            placeholder="Or paste a logo URL"
          />
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) {
                return;
              }
              setPending(true);
              try {
                await onUpload(file);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "Upload failed");
              } finally {
                setPending(false);
              }
            }}
          />
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Company name
          <input
            className={field}
            value={values.companyName}
            onChange={(event) => setField("companyName", event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Header button label
            <input
              className={field}
              value={values.headerCtaLabel}
              onChange={(event) => setField("headerCtaLabel", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Header button link
            <input
              className={field}
              value={values.headerCtaHref}
              onChange={(event) => setField("headerCtaHref", event.target.value)}
            />
          </label>
        </div>
        <MenuEditor
          title="Header menu"
          hint="These links appear in the top navigation and the mobile menu."
          items={headerMenu}
          onChange={setHeaderMenu}
        />
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-6">
        <h2 className="text-lg font-bold text-navy">Footer</h2>
        <label className="block text-sm font-medium text-slate-700">
          Tagline
          <input
            className={field}
            value={values.tagline}
            onChange={(event) => setField("tagline", event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          About text
          <textarea
            className={`${field} min-h-20`}
            value={values.footerBlurb}
            onChange={(event) => setField("footerBlurb", event.target.value)}
          />
        </label>
        <MenuEditor
          title="Footer quick links"
          hint="Shown in the footer. Can be different from the header menu."
          items={footerMenu}
          onChange={setFooterMenu}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Quick links heading
            <input
              className={field}
              value={values.footerQuickLinksHeading}
              onChange={(event) => setField("footerQuickLinksHeading", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Location heading
            <input
              className={field}
              value={values.footerLocationHeading}
              onChange={(event) => setField("footerLocationHeading", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Follow heading
            <input
              className={field}
              value={values.footerFollowHeading}
              onChange={(event) => setField("footerFollowHeading", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Subscribe heading
            <input
              className={field}
              value={values.footerSubscribeHeading}
              onChange={(event) => setField("footerSubscribeHeading", event.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Address
          <input
            className={field}
            value={values.address}
            onChange={(event) => setField("address", event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              className={field}
              value={values.phone}
              onChange={(event) => setField("phone", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className={field}
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Website
          <input
            className={field}
            value={values.website}
            onChange={(event) => setField("website", event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Instagram
            <input
              className={field}
              value={values.instagram}
              onChange={(event) => setField("instagram", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            LinkedIn
            <input
              className={field}
              value={values.linkedin}
              onChange={(event) => setField("linkedin", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            YouTube
            <input
              className={field}
              value={values.youtube}
              onChange={(event) => setField("youtube", event.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Subscribe text
          <input
            className={field}
            value={values.footerSubscribeText}
            onChange={(event) => setField("footerSubscribeText", event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Copyright line
          <input
            className={field}
            value={values.footerCopyright}
            onChange={(event) => setField("footerCopyright", event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Use {"{year}"} for the current year.
          </span>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Bottom line
          <input
            className={field}
            value={values.footerBottomLine}
            onChange={(event) => setField("footerBottomLine", event.target.value)}
          />
        </label>
      </section>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save header & footer"}
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-navy"
        >
          View live site
        </a>
      </div>
    </form>
  );
}
