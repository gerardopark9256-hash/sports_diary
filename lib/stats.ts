import {
  addDays,
  countWeekdaysBetween,
  monthKey,
  startOfWeek,
  todayStr,
  weekDates,
} from "./date";
import type { AppState, MemberId, Program, WorkoutLog } from "./types";

export function logsOf(state: AppState, memberId: MemberId): WorkoutLog[] {
  return state.logs.filter((l) => l.memberId === memberId);
}

/** 운동한 날짜 집합 (하루 여러 개여도 1일) */
export function activeDates(logs: WorkoutLog[]): Set<string> {
  return new Set(logs.map((l) => l.date));
}

export interface StreakInfo {
  current: number;
  best: number;
  frozenDates: string[]; // 프리즈로 메운 날짜
}

/**
 * 연속 운동일. 주(월~일) 1회 프리즈로 하루 공백을 메운다.
 * 오늘 기록이 없으면 어제부터 계산(오늘 아직 안 한 것뿐이므로 스트릭 유지).
 */
export function computeStreak(logs: WorkoutLog[]): StreakInfo {
  const dates = activeDates(logs);
  if (dates.size === 0) return { current: 0, best: 0, frozenDates: [] };

  const today = todayStr();
  let cursor = dates.has(today) ? today : addDays(today, -1);
  if (!dates.has(cursor)) {
    // 어제도 없으면 프리즈 1회로 메울 수 있는지 확인
    const dayBefore = addDays(cursor, -1);
    if (!dates.has(dayBefore)) return { current: 0, best: computeBestStreak(dates), frozenDates: [] };
  }

  let current = 0;
  const frozenDates: string[] = [];
  const usedFreezeWeeks = new Set<string>();

  while (true) {
    if (dates.has(cursor)) {
      current++;
      cursor = addDays(cursor, -1);
      continue;
    }
    // 공백 → 프리즈 시도 (해당 주에 아직 안 썼다면)
    const wk = startOfWeek(cursor);
    const prev = addDays(cursor, -1);
    if (!usedFreezeWeeks.has(wk) && dates.has(prev)) {
      usedFreezeWeeks.add(wk);
      frozenDates.push(cursor);
      current++;
      cursor = prev;
      continue;
    }
    break;
  }

  return { current, best: Math.max(current, computeBestStreak(dates)), frozenDates };
}

function computeBestStreak(dates: Set<string>): number {
  const sorted = Array.from(dates).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (prev && addDays(prev, 1) === d) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export interface MonthSummary {
  ym: string;
  activeDays: number;
  totalMin: number;
  count: number;
  avgIntensity: number;
  avgMood: number;
  goal: number;
  ratio: number;
}

export function monthSummary(state: AppState, memberId: MemberId, ym: string): MonthSummary {
  const member = state.members.find((m) => m.id === memberId);
  const logs = logsOf(state, memberId).filter((l) => monthKey(l.date) === ym);
  const days = activeDates(logs).size;
  const totalMin = logs.reduce((s, l) => s + (l.durationMin || 0), 0);
  const avgIntensity = logs.length ? logs.reduce((s, l) => s + l.intensity, 0) / logs.length : 0;
  const avgMood = logs.length ? logs.reduce((s, l) => s + l.mood, 0) / logs.length : 0;
  const goal = Math.round((member?.weeklyGoal ?? 3) * 4.3);
  return {
    ym,
    activeDays: days,
    totalMin,
    count: logs.length,
    avgIntensity,
    avgMood,
    goal,
    ratio: goal ? Math.min(1, days / goal) : 0,
  };
}

export function weekCount(state: AppState, memberId: MemberId, anchor = todayStr()): number {
  const week = new Set(weekDates(anchor));
  const dates = activeDates(logsOf(state, memberId));
  return Array.from(dates).filter((d) => week.has(d)).length;
}

export interface ProgramStats {
  planned: number;
  attended: number;
  rate: number;
  pricePerVisit: number;
  remaining: number;
  daysLeft: number;
  finished: boolean;
}

export function programStats(state: AppState, program: Program): ProgramStats {
  const planned =
    program.targetCount ??
    countWeekdaysBetween(program.startDate, program.endDate, program.weekdays);
  const attended = state.logs.filter((l) => l.programId === program.id).length;
  const rate = planned > 0 ? attended / planned : 0;
  const pricePerVisit = attended > 0 ? Math.round(program.price / attended) : program.price;
  const daysLeft = Math.round(
    (new Date(program.endDate).getTime() - new Date(todayStr()).getTime()) / 86400000
  );
  return {
    planned,
    attended,
    rate,
    pricePerVisit,
    remaining: Math.max(0, planned - attended),
    daysLeft,
    finished: daysLeft < 0,
  };
}

export interface LeaderRow {
  memberId: MemberId;
  name: string;
  emoji: string;
  color: string;
  days: number;
  minutes: number;
}

export function leaderboard(state: AppState, dates: string[]): LeaderRow[] {
  const range = new Set(dates);
  return state.members
    .map((m) => {
      const logs = logsOf(state, m.id).filter((l) => range.has(l.date));
      return {
        memberId: m.id,
        name: m.name,
        emoji: m.emoji,
        color: m.color,
        days: activeDates(logs).size,
        minutes: logs.reduce((s, l) => s + l.durationMin, 0),
      };
    })
    .sort((a, b) => b.days - a.days || b.minutes - a.minutes);
}

/** 4명 모두 운동한 날 목록 */
export function familyDays(state: AppState): string[] {
  const perMember = state.members.map((m) => activeDates(logsOf(state, m.id)));
  if (perMember.length === 0) return [];
  const [first, ...rest] = perMember;
  return Array.from(first)
    .filter((d) => rest.every((s) => s.has(d)))
    .sort();
}

export function activityBreakdown(logs: WorkoutLog[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) map.set(l.activity, (map.get(l.activity) ?? 0) + 1);
  return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function recentMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
