"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TabBar from "./TabBar";
import { useStore } from "@/lib/store";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** 헤더 우측 커스텀 영역 */
  right?: React.ReactNode;
  hideTabs?: boolean;
}

export default function AppShell({ title, subtitle, children, right, hideTabs }: Props) {
  const { loaded, currentMember } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (loaded && !currentMember) router.replace("/");
  }, [loaded, currentMember, router]);

  if (!loaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="animate-pulse text-3xl">🏃</div>
      </main>
    );
  }

  if (!currentMember) return null;

  return (
    <main className="min-h-dvh pb-24">
      <header
        className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 backdrop-blur"
        style={{
          borderColor: "var(--line)",
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        }}
      >
        <Link
          href="/settings"
          aria-label="프로필 전환"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl ring-2"
          style={{ background: `${currentMember.color}22`, boxShadow: `inset 0 0 0 2px ${currentMember.color}55` }}
        >
          {currentMember.emoji}
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight">{title}</h1>
          {subtitle ? <p className="truncate text-xs muted">{subtitle}</p> : null}
        </div>
        {right ?? (
          <Link
            href="/badges"
            aria-label="배지"
            className="grid h-11 w-11 place-items-center rounded-full text-xl card"
          >
            🏅
          </Link>
        )}
      </header>

      <div className="px-4 py-4">{children}</div>

      {!hideTabs && <TabBar />}
    </main>
  );
}
