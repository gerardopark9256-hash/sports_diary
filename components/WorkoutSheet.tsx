"use client";

import { useEffect, useState } from "react";
import PhotoPicker from "./PhotoPicker";
import Sheet from "./Sheet";
import { formatDateKo, parseDateStr } from "@/lib/date";
import { ACTIVITY_PRESETS, CENTER_NAME, uid } from "@/lib/seed";
import { computeStreak } from "@/lib/stats";
import { shareCard, workoutShareText } from "@/lib/share";
import { useStore } from "@/lib/store";
import type { Intensity, Mood, Place, WorkoutLog } from "@/lib/types";

const DURATIONS = [20, 30, 40, 50, 60, 90];
const PLACES: Place[] = [CENTER_NAME, "집", "야외", "기타"];
const MOOD_FACE = ["😵", "😕", "🙂", "😄", "🤩"];
const INTENSITY_LABEL = ["아주 가볍게", "가볍게", "보통", "빡세게", "극한"];

interface Props {
  open: boolean;
  date: string;
  editing?: WorkoutLog | null;
  onClose: () => void;
}

export default function WorkoutSheet({ open, date, editing, onClose }: Props) {
  const { state, currentMember, dispatch, removeLog } = useStore();
  const [activity, setActivity] = useState("수영");
  const [customActivity, setCustomActivity] = useState("");
  const [durationMin, setDurationMin] = useState(50);
  const [intensity, setIntensity] = useState<Intensity>(3);
  const [mood, setMood] = useState<Mood>(4);
  const [place, setPlace] = useState<Place>(CENTER_NAME);
  const [programId, setProgramId] = useState<string>("");
  const [startHour, setStartHour] = useState<string>("");
  const [memo, setMemo] = useState("");
  const [rainy, setRainy] = useState(false);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const known = ACTIVITY_PRESETS.some((a) => a.name === editing.activity);
      setActivity(known ? editing.activity : "직접입력");
      setCustomActivity(known ? "" : editing.activity);
      setDurationMin(editing.durationMin);
      setIntensity(editing.intensity);
      setMood(editing.mood);
      setPlace(editing.place);
      setProgramId(editing.programId ?? "");
      setStartHour(editing.startHour !== undefined ? String(editing.startHour) : "");
      setMemo(editing.memo ?? "");
      setRainy(!!editing.rainy);
      setPhotoIds(editing.photoIds);
      setShowMore(true);
    } else {
      setActivity("수영");
      setCustomActivity("");
      setDurationMin(50);
      setIntensity(3);
      setMood(4);
      setPlace(CENTER_NAME);
      setProgramId("");
      setStartHour("");
      setMemo("");
      setRainy(false);
      setPhotoIds([]);
      setShowMore(false);
    }
  }, [open, editing]);

  if (!currentMember) return null;

  const weekday = parseDateStr(date).getDay();
  const myPrograms = state.programs.filter(
    (p) => p.memberId === currentMember.id && p.startDate <= date && p.endDate >= date
  );
  const suggested = myPrograms.filter((p) => p.weekdays.includes(weekday));

  const finalActivity = activity === "직접입력" ? customActivity.trim() || "운동" : activity;

  const save = () => {
    const log: WorkoutLog = {
      id: editing?.id ?? uid("log"),
      memberId: currentMember.id,
      date,
      programId: programId || undefined,
      activity: finalActivity,
      place,
      startHour: startHour === "" ? undefined : Number(startHour),
      durationMin,
      intensity,
      mood,
      memo: memo.trim() || undefined,
      rainy: rainy || undefined,
      photoIds,
      createdAt: editing?.createdAt ?? Date.now(),
    };
    dispatch({ type: "UPSERT_LOG", log });
    onClose();
  };

  const share = () => {
    const logs = state.logs.filter((l) => l.memberId === currentMember.id);
    const streak = computeStreak(logs).current;
    void shareCard(
      workoutShareText({
        name: currentMember.name,
        activity: finalActivity,
        durationMin,
        streak: Math.max(streak, 1),
        date: formatDateKo(date),
      })
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title={`${formatDateKo(date)} 운동 기록`}>
      {/* 1. 종목 */}
      <section className="mb-4">
        <p className="mb-2 text-xs font-semibold muted">① 무슨 운동을 했나요?</p>
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITY_PRESETS.slice(0, 8).map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => setActivity(a.name)}
              className="flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-xl border text-xs line-c"
              style={
                activity === a.name
                  ? { borderColor: currentMember.color, background: `${currentMember.color}18`, fontWeight: 700 }
                  : undefined
              }
            >
              <span className="text-xl">{a.emoji}</span>
              {a.name}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {ACTIVITY_PRESETS.slice(8).map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => setActivity(a.name)}
              className="min-h-[38px] flex-1 rounded-lg border px-2 text-xs line-c"
              style={
                activity === a.name
                  ? { borderColor: currentMember.color, background: `${currentMember.color}18`, fontWeight: 700 }
                  : undefined
              }
            >
              {a.emoji} {a.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActivity("직접입력")}
            className="min-h-[38px] flex-1 rounded-lg border px-2 text-xs line-c"
            style={
              activity === "직접입력"
                ? { borderColor: currentMember.color, background: `${currentMember.color}18`, fontWeight: 700 }
                : undefined
            }
          >
            ✏️ 직접
          </button>
        </div>
        {activity === "직접입력" && (
          <input
            value={customActivity}
            onChange={(e) => setCustomActivity(e.target.value)}
            placeholder="종목 이름"
            className="mt-2 w-full rounded-xl border px-3 py-2.5 line-c"
            style={{ background: "transparent" }}
          />
        )}
      </section>

      {/* 2. 시간 + 강도 */}
      <section className="mb-4">
        <p className="mb-2 text-xs font-semibold muted">② 얼마나 했나요?</p>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDurationMin(d)}
              className="min-h-[42px] flex-1 rounded-xl border text-sm line-c"
              style={
                durationMin === d
                  ? { borderColor: currentMember.color, background: `${currentMember.color}18`, fontWeight: 700 }
                  : undefined
              }
            >
              {d}분
            </button>
          ))}
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="muted">운동 강도</span>
            <span className="font-semibold">{INTENSITY_LABEL[intensity - 1]}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value) as Intensity)}
            className="w-full"
            style={{ accentColor: currentMember.color }}
          />
        </div>
      </section>

      {/* 3. 저장 */}
      <button
        onClick={save}
        className="min-h-[52px] w-full rounded-2xl text-base font-bold text-white"
        style={{ background: currentMember.color }}
      >
        ③ 저장하기
      </button>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-3 w-full text-center text-xs muted"
      >
        {showMore ? "간단히 접기 ▲" : "기분·장소·사진 더 남기기 ▼"}
      </button>

      {showMore && (
        <div className="mt-4 space-y-4 border-t pt-4 line-c">
          <div>
            <p className="mb-2 text-xs font-semibold muted">운동 후 기분 (정신 맑음)</p>
            <div className="flex gap-2">
              {MOOD_FACE.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setMood((i + 1) as Mood)}
                  className="min-h-[48px] flex-1 rounded-xl border text-2xl line-c"
                  style={
                    mood === i + 1
                      ? { borderColor: currentMember.color, background: `${currentMember.color}18` }
                      : { opacity: 0.55 }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold muted">장소</p>
            <div className="flex gap-2">
              {PLACES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlace(p)}
                  className="min-h-[40px] flex-1 rounded-lg border px-1 text-xs line-c"
                  style={
                    place === p
                      ? { borderColor: currentMember.color, background: `${currentMember.color}18`, fontWeight: 700 }
                      : undefined
                  }
                >
                  {p === CENTER_NAME ? "센터" : p}
                </button>
              ))}
            </div>
          </div>

          {myPrograms.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold muted">
                등록 프로그램 연결 {suggested.length > 0 && "· 오늘 요일 수업이 있어요"}
              </p>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              >
                <option value="">연결 안 함</option>
                {myPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.weekdays.includes(weekday) ? " ⭐" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold muted">시작 시각</p>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={23}
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                placeholder="예: 6"
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-xs font-semibold muted">궂은 날씨</p>
              <button
                type="button"
                onClick={() => setRainy((v) => !v)}
                className="min-h-[46px] w-full rounded-xl border text-sm line-c"
                style={rainy ? { borderColor: currentMember.color, background: `${currentMember.color}18` } : undefined}
              >
                {rainy ? "🌧️ 그래도 갔다!" : "☀️ 보통"}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold muted">메모</p>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="오늘 몸 상태, 느낀 점…"
              className="w-full rounded-xl border px-3 py-2.5 line-c"
              style={{ background: "transparent" }}
            />
          </div>

          <PhotoPicker photoIds={photoIds} onChange={setPhotoIds} label="운동 인증샷" />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={share}
              className="min-h-[46px] flex-1 rounded-xl border font-semibold line-c"
            >
              💬 카톡 공유
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("이 기록을 삭제할까요?")) {
                    removeLog(editing.id);
                    onClose();
                  }
                }}
                className="min-h-[46px] flex-1 rounded-xl border border-red-500/40 font-semibold text-red-500"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
