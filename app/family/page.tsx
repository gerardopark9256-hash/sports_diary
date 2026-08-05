"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { activityEmoji } from "@/lib/seed";
import { currentMonthKey, formatDateKo, formatMonth, monthDates, todayStr, weekDates } from "@/lib/date";
import { uid } from "@/lib/seed";
import { computeStreak, familyDays, leaderboard, logsOf } from "@/lib/stats";
import { shareCard } from "@/lib/share";
import { useStore } from "@/lib/store";
import type { Sticker } from "@/lib/types";

const STICKERS: Sticker[] = ["🔥", "👏", "💪", "❤️", "🎉"];

export default function FamilyPage() {
  const { state, currentMember, dispatch } = useStore();
  const [tab, setTab] = useState<"week" | "month">("week");

  if (!currentMember) return <AppShell title="가족">{null}</AppShell>;

  const today = todayStr();
  const ym = currentMonthKey();
  const range = tab === "week" ? weekDates(today) : monthDates(ym);
  const rows = leaderboard(state, range);
  const fdays = familyDays(state);

  const monthLogsCount = state.logs.filter((l) => l.date.startsWith(ym)).length;
  const familyGoal = state.settings.familyMonthlyGoal;
  const familyRatio = Math.min(1, monthLogsCount / Math.max(1, familyGoal));

  const contributions = state.members.map((m) => ({
    ...m,
    count: state.logs.filter((l) => l.memberId === m.id && l.date.startsWith(ym)).length,
  }));

  // 최근 가족 활동 피드 (최근 15개)
  const feed = [...state.logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 15);

  const sendCheer = (toId: string, date: string, sticker: Sticker) => {
    dispatch({
      type: "ADD_CHEER",
      cheer: {
        id: uid("cheer"),
        fromId: currentMember.id,
        toId: toId as typeof currentMember.id,
        date,
        sticker,
        createdAt: Date.now(),
      },
    });
  };

  const shareLeaderboard = () => {
    const text = rows
      .slice(0, 4)
      .map((r, i) => `${["🥇", "🥈", "🥉", "4️⃣"][i]} ${r.name} ${r.days}일`)
      .join("\n");
    void shareCard({
      title: `👨‍👩‍👧‍👦 우리가족 ${tab === "week" ? "이번 주" : formatMonth(ym)} 운동 순위`,
      description: text,
    });
  };

  return (
    <AppShell title="우리가족" subtitle="같이 하면 더 멀리 갑니다">
      {/* 기간 탭 */}
      <div className="mb-3 flex gap-2">
        {(["week", "month"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="min-h-[40px] flex-1 rounded-xl border text-sm line-c"
            style={
              tab === t
                ? { borderColor: currentMember.color, background: `${currentMember.color}18`, fontWeight: 700 }
                : undefined
            }
          >
            {t === "week" ? "이번 주" : formatMonth(ym)}
          </button>
        ))}
      </div>

      {/* 리더보드 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">🏆 리더보드</h2>
          <button onClick={shareLeaderboard} className="rounded-lg border px-2.5 py-1 text-[11px] line-c">
            💬 공유
          </button>
        </div>
        <ul className="space-y-2">
          {rows.map((r, i) => {
            const isMe = r.memberId === currentMember.id;
            const top = rows[0].days;
            return (
              <li
                key={r.memberId}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: isMe ? `${r.color}14` : "transparent", outline: isMe ? `1px solid ${r.color}44` : undefined }}
              >
                <span className="w-6 text-center text-lg">
                  {r.days > 0 ? ["🥇", "🥈", "🥉", "4️⃣"][i] : "·"}
                </span>
                <span className="text-2xl">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {r.name} {isMe && <span className="text-[10px] muted">(나)</span>}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${top > 0 ? (r.days / top) * 100 : 0}%`, background: r.color }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold" style={{ color: r.color }}>
                    {r.days}일
                  </p>
                  <p className="text-[10px] muted">{Math.round(r.minutes / 60)}시간</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 가족 챌린지 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold">🎯 {formatMonth(ym)} 가족 챌린지</h2>
          <button
            onClick={() => {
              const v = prompt("이번 달 가족 합산 목표 (회)", String(familyGoal));
              if (v && Number(v) > 0) dispatch({ type: "UPDATE_SETTINGS", settings: { familyMonthlyGoal: Number(v) } });
            }}
            className="text-[11px] muted"
          >
            목표 수정
          </button>
        </div>
        <p className="mb-3 text-xs muted">
          네 사람 합쳐 <b>{familyGoal}회</b> 운동하기
        </p>
        <div className="flex h-4 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
          {contributions.map((c) => (
            <div
              key={c.id}
              style={{
                width: `${(c.count / Math.max(1, familyGoal)) * 100}%`,
                background: c.color,
              }}
              title={`${c.name} ${c.count}회`}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-sm font-bold">
          {monthLogsCount} / {familyGoal}회 ({Math.round(familyRatio * 100)}%)
          {familyRatio >= 1 && " 🎉 달성!"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {contributions.map((c) => (
            <span key={c.id} className="flex items-center gap-1 text-[11px] muted">
              <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
              {c.name} {c.count}회
            </span>
          ))}
        </div>
      </section>

      {/* 가족 스트릭 */}
      <section className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-4 text-center card">
          <p className="text-[11px] muted">네 사람 모두 운동한 날</p>
          <p className="mt-1 text-2xl font-extrabold">{fdays.length}일</p>
        </div>
        <div className="rounded-2xl p-4 text-center card">
          <p className="text-[11px] muted">가족 최장 스트릭</p>
          <p className="mt-1 text-2xl font-extrabold">
            {Math.max(0, ...state.members.map((m) => computeStreak(logsOf(state, m.id)).best))}일
          </p>
        </div>
      </section>

      {/* 응원 피드 */}
      <section className="rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">📣 가족 활동 &amp; 응원</h2>
        {feed.length === 0 ? (
          <p className="text-xs muted">아직 활동이 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {feed.map((l) => {
              const m = state.members.find((x) => x.id === l.memberId);
              if (!m) return null;
              const cheers = state.cheers.filter((c) => c.toId === l.memberId && c.date === l.date);
              const mine = l.memberId === currentMember.id;
              return (
                <li key={l.id} className="rounded-xl border p-3 line-c">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold" style={{ color: m.color }}>
                        {m.name}
                      </p>
                      <p className="text-[11px] muted">
                        {formatDateKo(l.date)} · {activityEmoji(l.activity)} {l.activity} {l.durationMin}분
                      </p>
                    </div>
                  </div>
                  {cheers.length > 0 && (
                    <p className="mt-2 text-sm">{cheers.map((c) => c.sticker).join(" ")}</p>
                  )}
                  {!mine && (
                    <div className="mt-2 flex gap-1.5">
                      {STICKERS.map((s) => (
                        <button
                          key={s}
                          onClick={() => sendCheer(l.memberId, l.date, s)}
                          className="min-h-[36px] flex-1 rounded-lg border text-base line-c active:scale-95"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
