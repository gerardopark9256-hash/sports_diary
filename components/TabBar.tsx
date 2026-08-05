"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "홈", icon: "🏠" },
  { href: "/calendar", label: "캘린더", icon: "📅" },
  { href: "/programs", label: "프로그램", icon: "🏊" },
  { href: "/progress", label: "변화", icon: "📈" },
  { href: "/family", label: "가족", icon: "👨‍👩‍👧‍👦" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t backdrop-blur"
      style={{
        borderColor: "var(--line)",
        background: "color-mix(in srgb, var(--card) 92%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px]"
                style={{ color: active ? "var(--accent)" : "var(--muted)" }}
              >
                <span className={`text-[20px] leading-none ${active ? "scale-110" : ""} transition-transform`}>
                  {t.icon}
                </span>
                <span className={active ? "font-bold" : ""}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
