"use client";

import { useEffect, useRef, useState } from "react";
import { addPhotoFromFile, deletePhoto, getPhotos } from "@/lib/photos";

interface Props {
  photoIds: string[];
  onChange: (ids: string[]) => void;
  max?: number;
  label?: string;
}

export default function PhotoPicker({ photoIds, onChange, max = 4, label = "사진" }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void getPhotos(photoIds).then((m) => {
      if (alive) setUrls(m);
    });
    return () => {
      alive = false;
    };
  }, [photoIds]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const room = max - photoIds.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      const ids: string[] = [];
      for (const f of picked) ids.push(await addPhotoFromFile(f));
      onChange([...photoIds, ...ids]);
    } catch (e) {
      alert("사진을 저장하지 못했어요. 다시 시도해 주세요.");
      console.error(e);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (id: string) => {
    void deletePhoto(id);
    onChange(photoIds.filter((p) => p !== id));
  };

  return (
    <div>
      <p className="mb-2 text-xs font-semibold muted">
        {label} ({photoIds.length}/{max})
      </p>
      <div className="flex flex-wrap gap-2">
        {photoIds.map((id) => (
          <div key={id} className="relative h-20 w-20 overflow-hidden rounded-xl border line-c">
            {urls[id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[id]} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-full w-full animate-pulse bg-black/10" />
            )}
            <button
              type="button"
              onClick={() => remove(id)}
              aria-label="사진 삭제"
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}

        {photoIds.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed text-2xl line-c disabled:opacity-50"
          >
            {busy ? "⏳" : "📷"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}

export function PhotoThumb({ id, className }: { id: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void getPhotos([id]).then((m) => {
      if (alive) setUrl(m[id] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [id]);
  if (!url) return <div className={`animate-pulse bg-black/10 ${className ?? ""}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className={className} />;
}
