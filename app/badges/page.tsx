"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Sheet from "@/components/Sheet";
import { BADGES, TIER_STYLE, badgesOf } from "@/lib/badges";
import { badgeShareText, shareCard } from "@/lib/share";
import { useStore } from "@/lib/store";
import type { BadgeDef, BadgeTier } from "@/lib/types";

const TIER_ORDER: BadgeTier[] = ["bronze", "silver", "gold", "legend"];

export default function BadgesPage() {
  const { state, currentMember } = useStore();
  const [detail, setDetail] = useState<BadgeDef | null>(null);

  if (!currentMember) return <AppShell title="배지">{null}</AppShell>;

  const awards = badgesOf(state, currentMember.id);
  const earned = new Map<string, number>();
  for (const a of awards) if (!earned.has(a.badgeId)) earned.set(a.badgeId, a.awardedAt);

  const countByBadge = new Map<string, number>();
  for (const a of awards) countByBadge.set(a.badgeId, (countByBadge.get(a.badgeId) ?? 0) + 1);

  return (
    <AppShell
      title="배지 진열장"
      subtitle={`${currentMember.name}님 · ${earned.size} / ${BADGES.length}개 획득`}
    >
      <div className="mb-4 rounded-2xl p-4 card">
        <div className="mb-2 flex items-end justify-between">
          <p className="text-sm font-bold">수집률</p>
          <p className="text-lg font-extrabold" style={{ color: currentMember.color }}>
            {Math.round((earned.size / BADGES.length) * 100)}%
          </p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(earned.size / BADGES.length) * 100}%`, background: currentMember.color }}
          />
        </div>
      </div>

      {TIER_ORDER.map((tier) => {
        const list = BADGES.filter((b) => b.tier === tier);
        const style = TIER_STYLE[tier];
        return (
          <section key={tier} className="mb-5">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${style.bg}`}>{style.label}</span>
              <span className="text-xs muted">
                {list.filter((b) => earned.has(b.id)).length}/{list.length}
              </span>
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {list.map((b) => {
                const got = earned.has(b.id);
                const cnt = countByBadge.get(b.id) ?? 0;
                return (
                  <button
                    key={b.id}
                    onClick={() => setDetail(b)}
                    className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl p-1 ${
                      got ? `ring-2 ${style.ring} ${style.bg}` : ""
                    }`}
                    style={got ? undefined : { background: "var(--line)", opacity: 0.55 }}
                  >
                    <span className={`text-2xl ${got ? "" : "grayscale"}`}>{got ? b.emoji : "🔒"}</span>
                    <span className="px-0.5 text-center text-[9px] font-semibold leading-tight">{b.name}</span>
                    {cnt > 1 && (
                      <span className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-[9px] text-white">
                        ×{cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <Sheet open={!!detail} onClose={() => setDetail(null)} title="배지 상세">
        {detail && (
          <div className="pb-2 text-center">
            <div
              className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-5xl ${
                earned.has(detail.id) ? TIER_STYLE[detail.tier].bg : ""
              }`}
              style={earned.has(detail.id) ? undefined : { background: "var(--line)" }}
            >
              {earned.has(detail.id) ? detail.emoji : "🔒"}
            </div>
            <h3 className="mt-3 text-lg font-extrabold">{detail.name}</h3>
            <p className="mt-1 text-sm muted">{detail.desc}</p>
            <p className="mt-2 text-xs muted">
              {TIER_STYLE[detail.tier].label} · {detail.group}
            </p>
            {earned.has(detail.id) ? (
              <>
                <p className="mt-3 text-xs" style={{ color: currentMember.color }}>
                  획득: {new Date(earned.get(detail.id)!).toLocaleDateString("ko-KR")}
                </p>
                <button
                  onClick={() =>
                    void shareCard(
                      badgeShareText({
                        name: currentMember.name,
                        badgeName: detail.name,
                        emoji: detail.emoji,
                      })
                    )
                  }
                  className="mt-4 min-h-[48px] w-full rounded-2xl font-bold text-white"
                  style={{ background: currentMember.color }}
                >
                  💬 카카오톡으로 자랑하기
                </button>
              </>
            ) : (
              <p className="mt-4 rounded-xl px-4 py-3 text-xs" style={{ background: "var(--line)" }}>
                아직 잠겨 있어요. 조건을 채우면 자동으로 열립니다!
              </p>
            )}
          </div>
        )}
      </Sheet>
    </AppShell>
  );
}
