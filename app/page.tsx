"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { MemberId } from "@/lib/types";

export default function SelectProfilePage() {
  const { state, loaded, dispatch } = useStore();
  const router = useRouter();

  // 이미 선택한 사람이 있으면 바로 자기 메인 화면으로
  useEffect(() => {
    if (loaded && state.currentMemberId) router.replace("/home");
  }, [loaded, state.currentMemberId, router]);

  const pick = (id: MemberId) => {
    dispatch({ type: "SELECT_MEMBER", id });
    router.replace("/home");
  };

  if (!loaded || state.currentMemberId) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="animate-pulse text-3xl">🏃</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="text-4xl">🏅</div>
        <h1 className="mt-3 text-2xl font-extrabold">우리가족 운동 다이어리</h1>
        <p className="mt-2 text-sm muted">몸을 튼튼하게, 정신을 맑게</p>
        <p className="mt-1 text-xs muted">누구세요? 한 번만 고르면 다음부터 바로 들어가요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {state.members.map((m) => (
          <button
            key={m.id}
            onClick={() => pick(m.id)}
            className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-transform active:scale-95"
            style={{ borderColor: `${m.color}66`, background: `${m.color}12` }}
          >
            <span className="text-5xl">{m.emoji}</span>
            <span className="text-lg font-bold" style={{ color: m.color }}>
              {m.name}
            </span>
            <span className="text-center text-[11px] leading-snug muted">{m.goalText}</span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] muted">
        바꾸고 싶으면 홈 왼쪽 위 프로필 아이콘을 누르세요.
      </p>
    </main>
  );
}
