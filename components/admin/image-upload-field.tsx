"use client";

import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/media-url";

type Props = {
  existing: string[];
  onExistingChange: (urls: string[]) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export function ImageUploadField({ existing, onExistingChange, files, onFilesChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [files]);

  function addFiles(list: FileList | null) {
    if (!list?.length) {
      return;
    }
    onFilesChange([...files, ...Array.from(list)]);
  }

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
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
        <span className="mt-1 text-xs">JPG, JPEG, PNG, WEBP or GIF · up to 5MB each</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
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
            <figure key={url} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {broken[url] ? (
                <p className="flex h-28 items-center px-2 text-center text-xs text-slate-500">
                  {url.split("/").pop()}
                </p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(url)}
                  alt=""
                  className="h-28 w-full object-cover"
                  onError={() => setBroken((current) => ({ ...current, [url]: true }))}
                />
              )}
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
            <figure key={`${file.name}-${file.size}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {previews[index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previews[index]} alt={file.name} className="h-28 w-full object-cover" />
              ) : (
                <p className="flex h-28 items-center px-2 text-center text-xs text-slate-500">{file.name}</p>
              )}
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
