"use client";

import { useEffect } from "react";

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="animate-fade absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="animate-sheet relative w-full max-w-[480px] rounded-t-3xl border-t px-4 pb-8 pt-3"
        style={{
          background: "var(--card)",
          borderColor: "var(--line)",
          maxHeight: "88dvh",
          overflowY: "auto",
          paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full" style={{ background: "var(--line)" }} />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full text-lg">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
