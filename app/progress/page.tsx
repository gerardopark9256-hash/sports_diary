"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import BeforeAfter from "@/components/BeforeAfter";
import PhotoPicker, { PhotoThumb } from "@/components/PhotoPicker";
import Sheet from "@/components/Sheet";
import { BarChart, DonutChart, LineChart } from "@/components/Charts";
import { monthKey, todayStr } from "@/lib/date";
import { uid } from "@/lib/seed";
import { activityBreakdown, logsOf, recentMonths } from "@/lib/stats";
import { useStore } from "@/lib/store";
import type { BodyRecord } from "@/lib/types";

export default function ProgressPage() {
  const { state, currentMember, dispatch, removeBody } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BodyRecord | null>(null);

  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState("");
  const [fat, setFat] = useState("");
  const [muscle, setMuscle] = useState("");
  const [note, setNote] = useState("");
  const [photoIds, setPhotoIds] = useState<string[]>([]);

  const [beforeId, setBeforeId] = useState<string>("");
  const [afterId, setAfterId] = useState<string>("");

  const myLogs = useMemo(
    () => (currentMember ? logsOf(state, currentMember.id) : []),
    [state, currentMember]
  );
  const bodies = useMemo(
    () =>
      currentMember
        ? state.bodyRecords.filter((b) => b.memberId === currentMember.id).sort((a, b) => a.date.localeCompare(b.date))
        : [],
    [state.bodyRecords, currentMember]
  );

  if (!currentMember) return <AppShell title="변화">{null}</AppShell>;

  const months = recentMonths(6);
  const monthlyDays = months.map((ym) => ({
    label: `${Number(ym.slice(5))}월`,
    value: new Set(myLogs.filter((l) => monthKey(l.date) === ym).map((l) => l.date)).size,
  }));
  const monthlyMood = months.map((ym) => {
    const ls = myLogs.filter((l) => monthKey(l.date) === ym);
    return {
      label: `${Number(ym.slice(5))}월`,
      value: ls.length ? Math.round((ls.reduce((s, l) => s + l.mood, 0) / ls.length) * 10) / 10 : 0,
    };
  });
  const moodAll = myLogs.length
    ? (myLogs.reduce((s, l) => s + l.mood, 0) / myLogs.length).toFixed(1)
    : "-";

  const recent = bodies.slice(-12);
  const series = [
    {
      name: "체중(kg)",
      color: currentMember.color,
      points: recent.filter((b) => b.weightKg != null).map((b) => ({ x: b.date, y: b.weightKg! })),
    },
    {
      name: "체지방(%)",
      color: "#ef4444",
      points: recent.filter((b) => b.bodyFatPct != null).map((b) => ({ x: b.date, y: b.bodyFatPct! })),
    },
    {
      name: "근육(kg)",
      color: "#10b981",
      points: recent.filter((b) => b.muscleKg != null).map((b) => ({ x: b.date, y: b.muscleKg! })),
    },
  ].filter((s) => s.points.length > 0);

  const allPhotos = bodies.flatMap((b) => b.photoIds.map((id) => ({ id, date: b.date })));
  const workoutPhotos = myLogs
    .flatMap((l) => l.photoIds.map((id) => ({ id, date: l.date })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  const firstWeight = bodies.find((b) => b.weightKg != null)?.weightKg;
  const lastWeight = [...bodies].reverse().find((b) => b.weightKg != null)?.weightKg;
  const delta = firstWeight != null && lastWeight != null ? lastWeight - firstWeight : null;

  const openNew = () => {
    setEditing(null);
    setDate(todayStr());
    setWeight("");
    setFat("");
    setMuscle("");
    setNote("");
    setPhotoIds([]);
    setOpen(true);
  };

  const openEdit = (b: BodyRecord) => {
    setEditing(b);
    setDate(b.date);
    setWeight(b.weightKg != null ? String(b.weightKg) : "");
    setFat(b.bodyFatPct != null ? String(b.bodyFatPct) : "");
    setMuscle(b.muscleKg != null ? String(b.muscleKg) : "");
    setNote(b.note ?? "");
    setPhotoIds(b.photoIds);
    setOpen(true);
  };

  const save = () => {
    const record: BodyRecord = {
      id: editing?.id ?? uid("body"),
      memberId: currentMember.id,
      date,
      weightKg: weight === "" ? undefined : Number(weight),
      bodyFatPct: fat === "" ? undefined : Number(fat),
      muscleKg: muscle === "" ? undefined : Number(muscle),
      note: note.trim() || undefined,
      photoIds,
    };
    dispatch({ type: "UPSERT_BODY", record });
    setOpen(false);
  };

  return (
    <AppShell
      title="나의 변화"
      subtitle={`${currentMember.name}님 · ${currentMember.goalText}`}
      right={
        <button
          onClick={openNew}
          className="grid h-11 w-11 place-items-center rounded-full text-xl font-bold text-white"
          style={{ background: currentMember.color }}
          aria-label="신체 기록 추가"
        >
          +
        </button>
      }
    >
      {/* 요약 */}
      <section className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl p-3 text-center card">
          <p className="text-[10px] muted">총 운동</p>
          <p className="text-lg font-extrabold">{myLogs.length}회</p>
        </div>
        <div className="rounded-2xl p-3 text-center card">
          <p className="text-[10px] muted">체중 변화</p>
          <p className="text-lg font-extrabold" style={{ color: delta == null ? undefined : delta < 0 ? "#10b981" : "#ef4444" }}>
            {delta == null ? "-" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}kg`}
          </p>
        </div>
        <div className="rounded-2xl p-3 text-center card">
          <p className="text-[10px] muted">정신 맑음</p>
          <p className="text-lg font-extrabold">{moodAll}/5</p>
        </div>
      </section>

      {/* 신체 그래프 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">신체 변화</h2>
        {series.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm muted">아직 신체 기록이 없어요.</p>
            <button
              onClick={openNew}
              className="mt-3 min-h-[44px] rounded-xl px-5 text-sm font-bold text-white"
              style={{ background: currentMember.color }}
            >
              첫 기록 남기기
            </button>
          </div>
        ) : (
          <LineChart series={series} />
        )}
      </section>

      {/* 운동량 추이 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">최근 6개월 운동일</h2>
        <BarChart data={monthlyDays} color={currentMember.color} unit="" />
      </section>

      {/* 마음 점수 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-1 text-sm font-bold">정신 맑음 지수</h2>
        <p className="mb-3 text-[11px] muted">운동 후 기분(1~5)의 월별 평균이에요.</p>
        <BarChart data={monthlyMood} color="#8b5cf6" />
      </section>

      {/* 종목 분포 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">종목 분포</h2>
        <DonutChart data={activityBreakdown(myLogs)} />
      </section>

      {/* Before / After */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">Before / After</h2>
        {allPhotos.length < 2 ? (
          <p className="text-xs muted">신체 기록에 사진을 2장 이상 넣으면 비교할 수 있어요.</p>
        ) : (
          <>
            <div className="mb-3 flex gap-2">
              <select
                value={beforeId || allPhotos[0].id}
                onChange={(e) => setBeforeId(e.target.value)}
                className="flex-1 rounded-xl border px-2 py-2 text-xs line-c"
                style={{ background: "transparent" }}
              >
                {allPhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.date}
                  </option>
                ))}
              </select>
              <select
                value={afterId || allPhotos[allPhotos.length - 1].id}
                onChange={(e) => setAfterId(e.target.value)}
                className="flex-1 rounded-xl border px-2 py-2 text-xs line-c"
                style={{ background: "transparent" }}
              >
                {allPhotos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.date}
                  </option>
                ))}
              </select>
            </div>
            <BeforeAfter
              beforeId={beforeId || allPhotos[0].id}
              afterId={afterId || allPhotos[allPhotos.length - 1].id}
              beforeLabel={allPhotos.find((p) => p.id === (beforeId || allPhotos[0].id))?.date ?? ""}
              afterLabel={
                allPhotos.find((p) => p.id === (afterId || allPhotos[allPhotos.length - 1].id))?.date ?? ""
              }
            />
          </>
        )}
      </section>

      {/* 포토월 */}
      {workoutPhotos.length > 0 && (
        <section className="mb-3 rounded-2xl p-4 card">
          <h2 className="mb-3 text-sm font-bold">운동 포토월</h2>
          <div className="grid grid-cols-3 gap-1.5">
            {workoutPhotos.map((p) => (
              <PhotoThumb key={p.id} id={p.id} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </section>
      )}

      {/* 신체 기록 리스트 */}
      <section className="rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">신체 기록</h2>
        {bodies.length === 0 ? (
          <p className="text-xs muted">기록이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {[...bodies].reverse().map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => openEdit(b)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left line-c"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold">{b.date}</p>
                    <p className="text-[11px] muted">
                      {b.weightKg != null && `${b.weightKg}kg `}
                      {b.bodyFatPct != null && `· 체지방 ${b.bodyFatPct}% `}
                      {b.muscleKg != null && `· 근육 ${b.muscleKg}kg`}
                    </p>
                    {b.note && <p className="mt-0.5 truncate text-[11px] muted">{b.note}</p>}
                  </div>
                  {b.photoIds[0] && (
                    <PhotoThumb id={b.photoIds[0]} className="h-12 w-12 rounded-lg object-cover" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "신체 기록 수정" : "신체 기록 추가"}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold muted">날짜</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 line-c"
              style={{ background: "transparent" }}
            />
          </div>
          <div className="flex gap-2">
            {[
              { label: "체중(kg)", value: weight, set: setWeight, ph: "62.5" },
              { label: "체지방(%)", value: fat, set: setFat, ph: "22.4" },
              { label: "근육(kg)", value: muscle, set: setMuscle, ph: "28.1" },
            ].map((f) => (
              <div key={f.label} className="flex-1">
                <p className="mb-2 text-xs font-semibold muted">{f.label}</p>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded-xl border px-3 py-2.5 line-c"
                  style={{ background: "transparent" }}
                />
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold muted">메모</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="인바디 결과, 컨디션 등"
              className="w-full rounded-xl border px-3 py-2.5 line-c"
              style={{ background: "transparent" }}
            />
          </div>

          <PhotoPicker photoIds={photoIds} onChange={setPhotoIds} label="바디/인바디 사진" max={2} />

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
                if (confirm("이 기록을 삭제할까요?")) {
                  removeBody(editing.id);
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
