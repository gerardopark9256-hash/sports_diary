import { STATE_VERSION, STORAGE_KEY, initialState } from "./seed";
import type { AppState } from "./types";

export function loadState(): AppState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return migrate(parsed);
  } catch {
    return initialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("저장 실패 (용량 초과일 수 있어요)", e);
  }
}

/** 이전 버전/부분 데이터를 안전하게 현재 스키마로 맞춘다. */
export function migrate(partial: Partial<AppState>): AppState {
  const base = initialState();
  const members = base.members.map((def) => {
    const saved = partial.members?.find((m) => m.id === def.id);
    return saved ? { ...def, ...saved } : def;
  });
  return {
    version: STATE_VERSION,
    currentMemberId: partial.currentMemberId ?? null,
    members,
    logs: (partial.logs ?? []).map((l) => ({ ...l, photoIds: l.photoIds ?? [] })),
    programs: partial.programs ?? [],
    bodyRecords: (partial.bodyRecords ?? []).map((b) => ({ ...b, photoIds: b.photoIds ?? [] })),
    badges: partial.badges ?? [],
    cheers: partial.cheers ?? [],
    settings: { ...base.settings, ...(partial.settings ?? {}) },
  };
}

export function exportJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/** 가져오기: 'merge'는 id 기준 중복 제거 후 합치고, 'replace'는 통째로 교체 */
export function importJson(current: AppState, raw: string, mode: "merge" | "replace"): AppState {
  const incoming = migrate(JSON.parse(raw) as Partial<AppState>);
  if (mode === "replace") return { ...incoming, currentMemberId: current.currentMemberId };

  const mergeById = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) map.set(x.id, x);
    return Array.from(map.values());
  };

  const badgeKey = (b: AppState["badges"][number]) => `${b.memberId}|${b.badgeId}|${b.key ?? ""}`;
  const badgeMap = new Map(current.badges.map((b) => [badgeKey(b), b]));
  for (const b of incoming.badges) if (!badgeMap.has(badgeKey(b))) badgeMap.set(badgeKey(b), b);

  return {
    ...current,
    members: current.members.map((m) => incoming.members.find((i) => i.id === m.id) ?? m),
    logs: mergeById(current.logs, incoming.logs),
    programs: mergeById(current.programs, incoming.programs),
    bodyRecords: mergeById(current.bodyRecords, incoming.bodyRecords),
    cheers: mergeById(current.cheers, incoming.cheers),
    badges: Array.from(badgeMap.values()),
    settings: { ...current.settings, ...incoming.settings },
  };
}

export function storageUsageKb(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  return Math.round((raw.length * 2) / 1024);
}
