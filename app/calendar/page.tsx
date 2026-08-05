"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import WorkoutSheet from "@/components/WorkoutSheet";
import { PhotoThumb } from "@/components/PhotoPicker";
import {
  currentMonthKey,
  formatDateKo,
  formatMonth,
  leadingBlanks,
  monthDates,
  parseDateStr,
  shiftMonth,
  todayStr,
  WEEKDAY_KO,
} from "@/lib/date";
import { activityEmoji } from "@/lib/seed";
import { logsOf, monthSummary } from "@/lib/stats";
import { useStore } from "@/lib/store";

export default function CalendarPage() {
  const { state, currentMember } = useStore();
  const [ym, setYm] = useState(currentMonthKey());
  const [selected, setSelected] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!currentMember) return <AppShell title="캘린더">{null}</AppShell>;

  const myLogs = logsOf(state, currentMember.id);
  const byDate = new Map<string, typeof myLogs>();
  for (const l of myLogs) {
    byDate.set(l.date, [...(byDate.get(l.date) ?? []), l]);
  }
  const summary = monthSummary(state, currentMember.id, ym);
  const days = monthDates(ym);
  const blanks = leadingBlanks(ym);
  const today = todayStr();
  const selectedLogs = selected ? byDate.get(selected) ?? [] : [];
  const cheersFor = (date: string) =>
    state.cheers.filter((c) => c.toId === currentMember.id && c.date === date);

  const openNew = (date: string) => {
    setSelected(date);
    setEditingId(null);
    setSheetOpen(true);
  };

  return (
    <AppShell title="운동 캘린더" subtitle={`${currentMember.name}님의 ${formatMonth(ym)}`}>
      {/* 월 이동 */}
      <div className="mb-3 flex items-center justify-between rounded-2xl px-2 py-2 card">
        <button
          onClick={() => setYm(shiftMonth(ym, -1))}
          className="grid h-10 w-10 place-items-center rounded-xl text-lg"
          aria-label="이전 달"
        >
          ◀
        </button>
        <button onClick={() => setYm(currentMonthKey())} className="text-base font-bold">
          {formatMonth(ym)}
        </button>
        <button
          onClick={() => setYm(shiftMonth(ym, 1))}
          className="grid h-10 w-10 place-items-center rounded-xl text-lg"
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>

      {/* 월간 요약 */}
      <div className="mb-3 grid grid-cols-4 gap-2">
        {[
          { label: "운동일", value: `${summary.activeDays}일` },
          { label: "총 시간", value: `${Math.round(summary.totalMin / 60)}h` },
          { label: "평균 강도", value: summary.avgIntensity ? summary.avgIntensity.toFixed(1) : "-" },
          { label: "평균 기분", value: summary.avgMood ? summary.avgMood.toFixed(1) : "-" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-2 text-center card">
            <p className="text-[10px] muted">{s.label}</p>
            <p className="text-sm font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="rounded-2xl p-3 card">
        <div className="mb-1 grid grid-cols-7">
          {WEEKDAY_KO.map((w, i) => (
            <div
              key={w}
              className="text-center text-[11px] font-semibold"
              style={{ color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "var(--muted)" }}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: blanks }, (_, i) => (
            <div key={`b${i}`} />
          ))}
          {days.map((d) => {
            const logs = byDate.get(d) ?? [];
            const has = logs.length > 0;
            const maxIntensity = has ? Math.max(...logs.map((l) => l.intensity)) : 0;
            const hasPhoto = logs.some((l) => l.photoIds.length > 0);
            const cheers = cheersFor(d);
            return (
              <button
                key={d}
                onClick={() => {
                  setSelected(d);
                  setEditingId(null);
                }}
                className="relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[11px]"
                style={{
                  background: has ? `${currentMember.color}${["", "26", "40", "59", "8c", "d9"][maxIntensity]}` : "transparent",
                  color: has && maxIntensity >= 4 ? "#fff" : "inherit",
                  outline:
                    d === today
                      ? `2px solid ${currentMember.color}`
                      : selected === d
                        ? "2px solid var(--muted)"
                        : undefined,
                }}
              >
                <span className="font-semibold">{parseDateStr(d).getDate()}</span>
                {has && <span className="text-[12px] leading-none">{activityEmoji(logs[0].activity)}</span>}
                {hasPhoto && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/90 ring-1 ring-black/20" />
                )}
                {cheers.length > 0 && (
                  <span className="absolute bottom-0.5 text-[8px]">{cheers[0].sticker}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center justify-end gap-1 text-[10px] muted">
          약함
          {[1, 2, 3, 4, 5].map((i) => (
            <i
              key={i}
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: `${currentMember.color}${["", "26", "40", "59", "8c", "d9"][i]}` }}
            />
          ))}
          강함
        </p>
      </div>

      {/* 선택 날짜 상세 */}
      {selected && (
        <div className="mt-3 rounded-2xl p-4 card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">{formatDateKo(selected)}</h2>
            <button
              onClick={() => openNew(selected)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: currentMember.color }}
            >
              + 기록 추가
            </button>
          </div>

          {selectedLogs.length === 0 ? (
            <p className="py-4 text-center text-xs muted">이 날은 기록이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {selectedLogs.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => {
                      setEditingId(l.id);
                      setSheetOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border p-3 text-left line-c"
                  >
                    <span className="text-2xl">{activityEmoji(l.activity)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {l.activity} {l.durationMin}분
                      </p>
                      <p className="truncate text-[11px] muted">
                        {l.place} · 강도 {l.intensity} · 기분 {["😵", "😕", "🙂", "😄", "🤩"][l.mood - 1]}
                        {l.memo ? ` · ${l.memo}` : ""}
                      </p>
                    </div>
                    {l.photoIds[0] && (
                      <PhotoThumb id={l.photoIds[0]} className="h-12 w-12 rounded-lg object-cover" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {cheersFor(selected).length > 0 && (
            <p className="mt-3 text-xs muted">
              받은 응원: {cheersFor(selected).map((c) => c.sticker).join(" ")}
            </p>
          )}
        </div>
      )}

      <WorkoutSheet
        open={sheetOpen}
        date={selected ?? today}
        editing={editingId ? myLogs.find((l) => l.id === editingId) ?? null : null}
        onClose={() => {
          setSheetOpen(false);
          setEditingId(null);
        }}
      />
    </AppShell>
  );
}
