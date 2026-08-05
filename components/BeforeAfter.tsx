"use client";

import { useEffect, useState } from "react";
import { getPhotos } from "@/lib/photos";

/** 두 장의 사진을 좌우 슬라이더로 비교한다. */
export default function BeforeAfter({
  beforeId,
  afterId,
  beforeLabel,
  afterLabel,
}: {
  beforeId: string;
  afterId: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [pos, setPos] = useState(50);

  useEffect(() => {
    let alive = true;
    void getPhotos([beforeId, afterId]).then((m) => {
      if (alive) setUrls(m);
    });
    return () => {
      alive = false;
    };
  }, [beforeId, afterId]);

  if (!urls[beforeId] || !urls[afterId]) {
    return <div className="h-64 w-full animate-pulse rounded-2xl bg-black/10" />;
  }

  return (
    <div>
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border line-c">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[afterId]} alt="after" className="absolute inset-0 h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[beforeId]}
          alt="before"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow"
          style={{ left: `${pos}%` }}
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
          {beforeLabel}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
          {afterLabel}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="mt-3 w-full"
        aria-label="비교 슬라이더"
      />
    </div>
  );
}
