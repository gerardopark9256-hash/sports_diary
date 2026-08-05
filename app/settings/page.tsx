"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Sheet from "@/components/Sheet";
import { exportJson, importJson, storageUsageKb } from "@/lib/storage";
import { useStore } from "@/lib/store";
import type { Member, MemberId } from "@/lib/types";

const EMOJI_CHOICES = ["🌷", "🐯", "🦋", "🦁", "🐻", "🐰", "🐼", "🦊", "🐧", "🐢", "⭐", "🌈"];
const COLOR_CHOICES = ["#e8618c", "#2f7de1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4", "#84cc16"];

export default function SettingsPage() {
  const { state, currentMember, dispatch } = useStore();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [msg, setMsg] = useState("");

  if (!currentMember) return <AppShell title="설정">{null}</AppShell>;

  const usage = storageUsageKb();
  const lastBackup = state.settings.lastBackupAt;
  const backupStale = !lastBackup || Date.now() - lastBackup > 30 * 86400000;

  const switchTo = (id: MemberId) => {
    dispatch({ type: "SELECT_MEMBER", id });
    router.push("/home");
  };

  const doExport = () => {
    const blob = new Blob([exportJson(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-sports-diary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    dispatch({ type: "UPDATE_SETTINGS", settings: { lastBackupAt: Date.now() } });
    setMsg("백업 파일을 내려받았어요. 안전한 곳에 보관하세요!");
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      const mode = confirm(
        "기존 데이터와 합칠까요?\n\n확인 = 합치기(권장)\n취소 = 통째로 덮어쓰기"
      )
        ? "merge"
        : "replace";
      const next = importJson(state, text, mode);
      dispatch({ type: "REPLACE_ALL", payload: next });
      setMsg(`가져오기 완료 (${mode === "merge" ? "합치기" : "덮어쓰기"})`);
    } catch (e) {
      setMsg("파일을 읽지 못했어요. 올바른 백업 파일인지 확인해 주세요.");
      console.error(e);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveMember = () => {
    if (!editing) return;
    dispatch({ type: "UPDATE_MEMBER", member: editing });
    setEditing(null);
    setMsg("프로필을 저장했어요.");
  };

  return (
    <AppShell title="설정" subtitle={`${currentMember.name}님으로 사용 중`}>
      {msg && (
        <p className="mb-3 rounded-xl px-3 py-2.5 text-xs" style={{ background: "var(--line)" }}>
          {msg}
        </p>
      )}

      {/* 프로필 전환 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">누구세요?</h2>
        <div className="grid grid-cols-2 gap-2">
          {state.members.map((m) => {
            const active = m.id === currentMember.id;
            return (
              <div
                key={m.id}
                className="rounded-xl border p-3 text-center line-c"
                style={active ? { borderColor: m.color, background: `${m.color}12` } : undefined}
              >
                <button onClick={() => switchTo(m.id)} className="w-full">
                  <span className="block text-3xl">{m.emoji}</span>
                  <span className="mt-1 block text-sm font-bold" style={{ color: m.color }}>
                    {m.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] muted">
                    {active ? "사용 중" : "이 사람으로 전환"}
                  </span>
                </button>
                <button
                  onClick={() => setEditing({ ...m })}
                  className="mt-2 w-full rounded-lg border py-1 text-[11px] line-c"
                >
                  편집
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 백업 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-1 text-sm font-bold">데이터 백업</h2>
        <p className="mb-3 text-[11px] muted">
          기록은 이 기기의 브라우저에만 저장돼요. 삭제되면 복구할 수 없으니 가끔 백업하세요.
        </p>
        {backupStale && (
          <p className="mb-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "#f59e0b22", color: "#b45309" }}>
            ⚠️ 최근 30일 안에 백업한 기록이 없어요.
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={doExport} className="min-h-[46px] flex-1 rounded-xl border font-semibold line-c">
            ⬇️ 내보내기
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="min-h-[46px] flex-1 rounded-xl border font-semibold line-c"
          >
            ⬆️ 가져오기
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
          }}
        />
        <p className="mt-3 text-[11px] muted">
          사용 중 저장 공간 약 {usage}KB · 마지막 백업{" "}
          {lastBackup ? new Date(lastBackup).toLocaleDateString("ko-KR") : "없음"}
        </p>
      </section>

      {/* 통계 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold">전체 데이터</h2>
        <ul className="grid grid-cols-2 gap-2 text-xs">
          <li className="rounded-lg px-3 py-2" style={{ background: "var(--line)" }}>
            운동 기록 {state.logs.length}건
          </li>
          <li className="rounded-lg px-3 py-2" style={{ background: "var(--line)" }}>
            프로그램 {state.programs.length}개
          </li>
          <li className="rounded-lg px-3 py-2" style={{ background: "var(--line)" }}>
            신체 기록 {state.bodyRecords.length}건
          </li>
          <li className="rounded-lg px-3 py-2" style={{ background: "var(--line)" }}>
            배지 {state.badges.length}개
          </li>
        </ul>
      </section>

      {/* 카카오 공유 안내 */}
      <section className="mb-3 rounded-2xl p-4 card">
        <h2 className="mb-1 text-sm font-bold">카카오톡 공유</h2>
        <p className="text-[11px] muted">
          {process.env.NEXT_PUBLIC_KAKAO_JS_KEY
            ? "카카오 SDK가 연결되어 있어요. 공유 버튼이 카카오톡으로 바로 전송합니다."
            : "카카오 키가 없어도 공유는 됩니다 — 휴대폰 기본 공유창(카카오톡 선택 가능) 또는 클립보드 복사로 동작해요."}
        </p>
        {!process.env.NEXT_PUBLIC_KAKAO_JS_KEY && (
          <p className="mt-2 rounded-lg px-3 py-2 text-[10px] leading-relaxed" style={{ background: "var(--line)" }}>
            카카오 직접 전송을 켜려면 Vercel 프로젝트 환경변수에
            <br />
            <code className="font-bold">NEXT_PUBLIC_KAKAO_JS_KEY</code> 를 추가하고,
            <br />
            카카오 개발자 콘솔 → 플랫폼 → Web 에 배포 주소를 등록하세요.
          </p>
        )}
      </section>

      {/* 위험 구역 */}
      <section className="rounded-2xl p-4 card">
        <h2 className="mb-3 text-sm font-bold text-red-500">전체 초기화</h2>
        <button
          onClick={() => {
            if (!confirm("모든 운동 기록·배지·프로그램이 삭제됩니다. 계속할까요?")) return;
            if (!confirm("정말 삭제할까요? 되돌릴 수 없어요. 먼저 백업을 권장합니다.")) return;
            dispatch({ type: "RESET" });
            router.replace("/");
          }}
          className="min-h-[46px] w-full rounded-xl border border-red-500/40 font-semibold text-red-500"
        >
          모든 데이터 삭제
        </button>
      </section>

      {/* 프로필 편집 시트 */}
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="프로필 편집">
        {editing && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold muted">이름</p>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold muted">아바타</p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEditing({ ...editing, emoji: e })}
                    className="grid h-11 w-11 place-items-center rounded-xl border text-xl line-c"
                    style={editing.emoji === e ? { borderColor: editing.color, background: `${editing.color}18` } : undefined}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold muted">내 색깔</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditing({ ...editing, color: c })}
                    className="h-11 w-11 rounded-xl"
                    style={{ background: c, outline: editing.color === c ? "3px solid var(--text)" : undefined }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold muted">내 목표 한 줄</p>
              <input
                value={editing.goalText}
                onChange={(e) => setEditing({ ...editing, goalText: e.target.value })}
                className="w-full rounded-xl border px-3 py-2.5 line-c"
                style={{ background: "transparent" }}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold muted">주간 목표 횟수: {editing.weeklyGoal}회</p>
              <input
                type="range"
                min={1}
                max={7}
                value={editing.weeklyGoal}
                onChange={(e) => setEditing({ ...editing, weeklyGoal: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: editing.color }}
              />
            </div>
            <button
              onClick={saveMember}
              className="min-h-[52px] w-full rounded-2xl font-bold text-white"
              style={{ background: editing.color }}
            >
              저장
            </button>
          </div>
        )}
      </Sheet>
    </AppShell>
  );
}
