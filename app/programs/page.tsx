"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import Sheet from "@/components/Sheet";
import { countWeekdaysBetween, todayStr, WEEKDAY_KO } from "@/lib/date";
import { CENTER_NAME, uid } from "@/lib/seed";
import { programStats } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { Program } from "@/lib/types";

const PRESET_TITLES = ["성인 수영 초급", "성인 수영 중급", "헬스 자유이용", "필라테스", "요가", "아쿠아로빅", "배드민턴", "스피닝"];

export default function ProgramsPage() {
  const { state, currentMember, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [weekdays, setWeekdays] = useState<number[]>([2, 4]);
  const [timeLabel, setTimeLabel] = useState("");
  const [price, setPrice] = useState("");

  if (!currentMember) return <AppShell title="프로그램">{null}</AppShell>;

  const mine = state.programs
    .filter((p) => p.memberId === currentMember.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const openNew = () => {
    setEditing(null);
    setTitle("");
    const t = todayStr();
    setStartDate(t);
    const end = new Date(t);
    end.setMonth(end.getMonth() + 3);
    setEndDate(
      `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
    );
    setWeekdays([2, 4]);
    setTimeLabel("");
    setPrice("");
    setOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditing(p);
    setTitle(p.title);
    setStartDate(p.startDate);
    setEndDate(p.endDate);
    setWeekdays(p.weekdays);
    setTimeLabel(p.timeLabel ?? "");
    setPrice(String(p.price));
    setOpen(true);
  };

  const save = () => {
    if (!title.trim()) {
      alert("프로그램 이름을 입력해 주세요.");
      return;
    }
    const program: Program = {
      id: editing?.id ?? uid("prg"),
      memberId: currentMember.id,
      title: title.trim(),
      center: CENTER_NAME,
      startDate,
      endDate,
      weekdays,
      timeLabel: timeLabel.trim() || undefined,
      price: Number(price) || 0,
      active: true,
    };
    dispatch({ type: "UPSERT_PROGRAM", program });
    setOpen(false);
  };

  const plannedPreview = countWeekdaysBetween(startDate, endDate, weekdays);

  return (
    <AppShell
      title="등록 프로그램"
      subtitle={`${CENTER_NAME} · ${currentMember.name}님`}
      right={
        <button
          onClick={openNew}
          className="grid h-11 w-11 place-items-center rounded-full text-xl font-bold text-white"
          style={{ background: currentMember.color }}
          aria-label="프로그램 추가"
        >
          +
        </button>
      }
    >
      {mine.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-8 text-center line-c">
          <p className="text-3xl">🏊</p>
          <p className="mt-3 text-sm font-semibold">등록한 프로그램이 없어요</p>
          <p className="mt-1 text-xs muted">
            결제 금액을 넣으면 <b>1회당 실제 단가</b>를 계산해 드려요.
          </p>
          <button
            onClick={openNew}
            className="mt-4 min-h-[44px] rounded-xl px-5 font-bold text-white"
            style={{ background: currentMember.color }}
          >
            프로그램 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((p) => {
            const st = programStats(state, p);
            const warn = st.rate < 0.6 && !st.finished;
            const great = st.rate >= 0.9;
            return (
              <button
                key={p.id}
                onClick={() => openEdit(p)}
                className="block w-full rounded-2xl p-4 text-left card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{p.title}</p>
                    <p className="mt-0.5 text-[11px] muted">
                      {p.startDate} ~ {p.endDate}
                      {p.timeLabel ? ` · ${p.timeLabel}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] muted">
                      {p.weekdays.map((w) => WEEKDAY_KO[w]).join("·")}요일 · {p.price.toLocaleString()}원
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold"
                    style={{
                      background: st.finished ? "var(--line)" : `${currentMember.color}22`,
                      color: st.finished ? "var(--muted)" : currentMember.color,
                    }}
                  >
                    {st.finished ? "종료" : `D-${Math.max(0, st.daysLeft)}`}
                  </span>
                </div>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, st.rate * 100)}%`,
                      background: warn ? "#ef4444" : great ? "#10b981" : currentMember.color,
                    }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] muted">출석</p>
                    <p className="text-sm font-bold">
                      {st.attended}/{st.planned}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] muted">출석률</p>
                    <p className="text-sm font-bold" style={{ color: warn ? "#ef4444" : great ? "#10b981" : "inherit" }}>
                      {Math.round(st.rate * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] muted">1회당</p>
                    <p className="text-sm font-extrabold" style={{ color: warn ? "#ef4444" : "inherit" }}>
                      {st.attended === 0 ? "—" : `${st.pricePerVisit.toLocaleString()}원`}
                    </p>
                  </div>
                </div>

                {!st.finished && (
                  <p className="mt-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "var(--line)" }}>
                    {great
                      ? "🎉 본전 뽑았어요! 이 페이스 그대로!"
                      : st.attended === 0
                        ? `아직 출석 기록이 없어요. 첫 수업을 캘린더에 남겨보세요 🗓️`
                        : warn
                          ? `⚠️ 출석률이 낮아요. 이번 주 2번 더 가면 1회당 ${Math.round(
                              p.price / (st.attended + 2)
                            ).toLocaleString()}원!`
                          : `앞으로 ${st.remaining}회 남았어요. 계속 가봐요 💪`}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "프로그램 수정" : "프로그램 등록"}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold muted">프로그램 이름</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 성인 수영 초급"
              className="w-full rounded-xl border px-3 py-2.5 line-c"
              style={{ background: "transparent" }}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_TITLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTitle(t)}
                  className="rounded-full border px-2.5 py-1 text-[11px] line-c"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold muted">시작일</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold muted">종료일</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold muted">수업 요일</p>
            <div className="flex gap-1.5">
              {WEEKDAY_KO.map((w, i) => (
                <button
                  key={w}
                  type="button"
                  onClick={() =>
                    setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()))
                  }
                  className="min-h-[44px] flex-1 rounded-lg border text-sm line-c"
                  style={
                    weekdays.includes(i)
                      ? { borderColor: currentMember.color, background: `${currentMember.color}22`, fontWeight: 700 }
                      : undefined
                  }
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold muted">시간 (선택)</p>
              <input
                value={timeLabel}
                onChange={(e) => setTimeLabel(e.target.value)}
                placeholder="06:00~06:50"
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold muted">결제 금액(원)</p>
              <input
                type="number"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150000"
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
          </div>

          <p className="rounded-xl px-3 py-2.5 text-xs" style={{ background: "var(--line)" }}>
            예정 수업 <b>{plannedPreview}회</b>
            {Number(price) > 0 && plannedPreview > 0 && (
              <> · 다 나가면 1회당 <b>{Math.round(Number(price) / plannedPreview).toLocaleString()}원</b></>
            )}
          </p>

          <button
            onClick={save}
            className="min-h-[52px] w-full rounded-2xl font-bold text-white"
            style={{ background: currentMember.color }}
          >
            저장
          </button>

          {editing && (
            <button
              onClick={() => {
                if (confirm("이 프로그램을 삭제할까요? (운동 기록은 남습니다)")) {
                  dispatch({ type: "DELETE_PROGRAM", id: editing.id });
                  setOpen(false);
                }
              }}
              className="min-h-[46px] w-full rounded-xl border border-red-500/40 font-semibold text-red-500"
            >
              삭제
            </button>
          )}
        </div>
      </Sheet>
    </AppShell>
  );
}
