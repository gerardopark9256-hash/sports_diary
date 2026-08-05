"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import WorkoutSheet from "@/components/WorkoutSheet";
import { ProgressRing } from "@/components/Charts";
import { BADGE_MAP } from "@/lib/badges";
import { badgesOf } from "@/lib/badges";
import { currentMonthKey, formatDateKo, todayStr, weekDates, WEEKDAY_KO, parseDateStr } from "@/lib/date";
import { activityEmoji, quoteOfDay } from "@/lib/seed";
import { computeStreak, logsOf, monthSummary, programStats } from "@/lib/stats";
import { monthlyShareText, shareCard } from "@/lib/share";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { state, currentMember } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!currentMember) return <AppShell title="로딩 중">{null}</AppShell>;

  const today = todayStr();
  const ym = currentMonthKey();
  const myLogs = logsOf(state, currentMember.id);
  const streak = computeStreak(myLogs);
  const summary = monthSummary(state, currentMember.id, ym);
  const todayLogs = myLogs.filter((l) => l.date === today);
  const week = weekDates(today);
  const activeSet = new Set(myLogs.map((l) => l.date));
  const myPrograms = state.programs.filter((p) => p.memberId === currentMember.id && p.endDate >= today);
  const recentBadges = badgesOf(state, currentMember.id).slice(0, 3);
  const editing = editingId ? myLogs.find((l) => l.id === editingId) ?? null : null;
  const frozenToday = streak.frozenDates.length > 0;

  return (
    <AppShell
      title={`${currentMember.name}님, 오늘도 맑게 💪`}
      subtitle={formatDateKo(today)}
    >
      {/* 스트릭 */}
      <section className="mb-3 flex items-center gap-4 rounded-2xl p-4 card">
        <div className="text-4xl animate-flame">🔥</div>
        <div className="flex-1">
          <p className="text-2xl font-extrabold leading-none">
            {streak.current}
            <span className="ml-1 text-sm font-semibold muted">일 연속</span>
          </p>
          <p className="mt-1 text-xs muted">
            최장 {streak.best}일
            {frozenToday && <span className="ml-2">🧊 프리즈 {streak.frozenDates.length}회 사용</span>}
          </p>
        </div>
        <div className="text-right text-xs muted">
          <p>이번 주</p>
          <p className="text-base font-bold" style={{ color: currentMember.color }}>
            {week.filter((d) => activeSet.has(d)).length}/{currentMember.weeklyGoal}회
          </p>
        </div>
      </section>

      {/* 오늘 기록 */}
      <section className="mb-3">
        {todayLogs.length === 0 ? (
          <button
            onClick={() => {
              setEditingId(null);
              setSheetOpen(true);
            }}
            className="min-h-[64px] w-full rounded-2xl text-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
            style={{ background: currentMember.color }}
          >
            + 오늘 운동 기록하기
          </button>
        ) : (
          <div className="space-y-2">
            {todayLogs.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setEditingId(l.id);
                  setSheetOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-4 text-left card"
              >
                <span className="text-3xl">{activityEmoji(l.activity)}</span>
                <div className="flex-1">
                  <p className="font-bold">
                    {l.activity} {l.durationMin}분
                  </p>
                  <p className="text-xs muted">
                    {l.place} · 강도 {"●".repeat(l.intensity)}
                    {l.photoIds.length > 0 && ` · 📸 ${l.photoIds.length}`}
                  </p>
                </div>
                <span className="text-xl">{["😵", "😕", "🙂", "😄", "🤩"][l.mood - 1]}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setEditingId(null);
                setSheetOpen(true);
              }}
              className="min-h-[44px] w-full rounded-xl border text-sm font-semibold line-c"
            >
              + 오늘 하나 더 기록
            </button>
          </div>
        )}
      </section>

      {/* 이번 달 진행 */}
      <section className="mb-3 flex items-center gap-4 rounded-2xl p-4 card">
        <ProgressRing
          ratio={summary.ratio}
          color={currentMember.color}
          label={`${Math.round(summary.ratio * 100)}%`}
          sub={`${summary.activeDays}/${summary.goal}일`}
        />
        <div className="flex-1">
          <p className="text-sm font-bold">이번 달 진행</p>
          <ul className="mt-2 space-y-1 text-xs muted">
            <li>총 운동 {summary.count}회</li>
            <li>총 시간 {Math.floor(summary.totalMin / 60)}시간 {summary.totalMin % 60}분</li>
            <li>평균 기분 {summary.avgMood ? summary.avgMood.toFixed(1) : "-"} / 5</li>
          </ul>
          <button
            onClick={() =>
              void shareCard(
                monthlyShareText({
                  name: currentMember.name,
                  ym,
                  activeDays: summary.activeDays,
                  totalMin: summary.totalMin,
                  badges: badgesOf(state, currentMember.id).length,
                })
              )
            }
            className="mt-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold line-c"
          >
            💬 월간 리포트 공유
          </button>
        </div>
      </section>

      {/* 진행 중 프로그램 */}
      <section className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">등록한 프로그램</h2>
          <Link href="/programs" className="text-xs muted">
            전체 보기 ›
          </Link>
        </div>
        {myPrograms.length === 0 ? (
          <Link
            href="/programs"
            className="block rounded-2xl border-2 border-dashed p-4 text-center text-sm muted line-c"
          >
            성북레포츠센터 프로그램을 등록해 보세요 🏊
          </Link>
        ) : (
          <div className="space-y-2">
            {myPrograms.slice(0, 2).map((p) => {
              const st = programStats(state, p);
              const warn = st.rate < 0.6;
              return (
                <Link key={p.id} href="/programs" className="block rounded-2xl p-4 card">
                  <div className="flex items-baseline justify-between">
                    <p className="font-bold">{p.title}</p>
                    <p className="text-xs muted">D-{Math.max(0, st.daysLeft)}</p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, st.rate * 100)}%`,
                        background: warn ? "#ef4444" : currentMember.color,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs muted">
                    출석 {st.attended}/{st.planned}회
                    {st.attended > 0 && (
                      <>
                        {" · "}
                        <b style={{ color: warn ? "#ef4444" : "inherit" }}>
                          1회당 {st.pricePerVisit.toLocaleString()}원
                        </b>
                      </>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 이번 주 미니 캘린더 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">이번 주</h2>
        <div className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const on = activeSet.has(d);
            const isToday = d === today;
            return (
              <Link
                key={d}
                href="/calendar"
                className="flex flex-col items-center gap-1 rounded-lg py-1.5"
                style={isToday ? { outline: `2px solid ${currentMember.color}55` } : undefined}
              >
                <span className="text-[10px] muted">{WEEKDAY_KO[parseDateStr(d).getDay()]}</span>
                <span
                  className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold"
                  style={{
                    background: on ? currentMember.color : "var(--line)",
                    color: on ? "#fff" : "var(--muted)",
                  }}
                >
                  {parseDateStr(d).getDate()}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 최근 배지 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">최근 획득 배지</h2>
          <Link href="/badges" className="text-xs muted">
            전체 ›
          </Link>
        </div>
        {recentBadges.length === 0 ? (
          <p className="text-xs muted">첫 운동을 기록하면 배지가 열려요 🏅</p>
        ) : (
          <div className="flex gap-3">
            {recentBadges.map((b) => {
              const def = BADGE_MAP.get(b.badgeId);
              if (!def) return null;
              return (
                <div key={`${b.badgeId}${b.key ?? ""}`} className="flex flex-col items-center gap-1">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-black/5 text-2xl">
                    {def.emoji}
                  </span>
                  <span className="text-[10px] muted">{def.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 오늘의 한마디 */}
      <section className="rounded-2xl p-4 text-center card">
        <p className="text-xs muted">오늘의 한마디</p>
        <p className="mt-1 text-sm font-semibold">&ldquo;{quoteOfDay(today)}&rdquo;</p>
      </section>

      <WorkoutSheet
        open={sheetOpen}
        date={today}
        editing={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditingId(null);
        }}
      />
    </AppShell>
  );
}
