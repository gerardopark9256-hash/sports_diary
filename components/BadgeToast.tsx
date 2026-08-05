"use client";

import { useEffect, useState } from "react";
import { BADGE_MAP, TIER_STYLE } from "@/lib/badges";
import { badgeShareText, shareCard } from "@/lib/share";
import { useStore } from "@/lib/store";

/** 새로 획득한 배지를 순차적으로 축하 모달로 보여준다. */
export default function BadgeToast() {
  const { pendingBadges, dispatch, state } = useStore();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pendingBadges.length === 0) setIndex(0);
  }, [pendingBadges.length]);

  if (pendingBadges.length === 0) return null;
  const award = pendingBadges[Math.min(index, pendingBadges.length - 1)];
  const def = BADGE_MAP.get(award.badgeId);
  if (!def) return null;

  const member = state.members.find((m) => m.id === award.memberId);
  const tier = TIER_STYLE[def.tier];
  const isLast = index >= pendingBadges.length - 1;

  const close = () => {
    if (isLast) dispatch({ type: "CLEAR_PENDING" });
    else setIndex((i) => i + 1);
  };

  return (
    <div className="animate-fade fixed inset-0 z-50 grid place-items-center bg-black/55 px-6">
      <div className={`animate-pop w-full max-w-[340px] rounded-3xl p-6 text-center card ring-4 ${tier.ring}`}>
        <p className="text-xs font-bold muted">배지 획득!</p>
        <div className={`mx-auto my-4 grid h-24 w-24 place-items-center rounded-full text-5xl ${tier.bg}`}>
          {def.emoji}
        </div>
        <h2 className="text-xl font-extrabold">{def.name}</h2>
        <p className="mt-1 text-sm muted">{def.desc}</p>
        <p className="mt-2 text-xs muted">
          {tier.label} · {member?.name}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() =>
              void shareCard(
                badgeShareText({
                  name: member?.name ?? "",
                  badgeName: def.name,
                  emoji: def.emoji,
                })
              )
            }
            className="min-h-[44px] flex-1 rounded-xl border font-semibold line-c"
          >
            공유
          </button>
          <button
            onClick={close}
            className="min-h-[44px] flex-1 rounded-xl bg-[var(--accent)] font-semibold text-white"
          >
            {isLast ? "좋아요!" : `다음 (${pendingBadges.length - index - 1})`}
          </button>
        </div>
      </div>
    </div>
  );
}
