"use client";

import { useRef, useState } from "react";

type Props = {
  existing: string[];
  onExistingChange: (urls: string[]) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export function ImageUploadField({ existing, onExistingChange, files, onFilesChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  function addFiles(list: FileList | null) {
    if (!list?.length) {
      return;
    }
    const next = [...files, ...Array.from(list)];
    onFilesChange(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Photos</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-600 hover:border-gold hover:bg-amber-50"
      >
        <span className="font-semibold text-navy">Add machine photos</span>
        <span className="mt-1 text-xs">JPG, PNG, WEBP or GIF · up to 5MB each</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {existing.length + files.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {existing.map((url) => (
            <figure key={url} className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-28 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-rose-700"
                onClick={() => onExistingChange(existing.filter((item) => item !== url))}
              >
                Remove
              </button>
            </figure>
          ))}
          {files.map((file, index) => (
            <figure key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[index]} alt={file.name} className="h-28 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-rose-700"
                onClick={() => removeFile(index)}
              >
                Remove
              </button>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
