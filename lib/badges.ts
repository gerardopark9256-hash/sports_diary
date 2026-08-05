import { addDays, monthDates, monthKey, parseDateStr, startOfWeek, todayStr } from "./date";
import {
  activeDates,
  computeStreak,
  familyDays,
  leaderboard,
  logsOf,
  monthSummary,
  programStats,
} from "./stats";
import type { AppState, BadgeAward, BadgeDef, MemberId } from "./types";

export const BADGES: BadgeDef[] = [
  // 스트릭
  { id: "first-step", name: "첫걸음", desc: "첫 운동을 기록했어요", emoji: "👟", tier: "bronze", group: "스트릭" },
  { id: "streak-3", name: "삼일의 벽 돌파", desc: "3일 연속 운동", emoji: "🌱", tier: "bronze", group: "스트릭" },
  { id: "streak-7", name: "일주일 전사", desc: "7일 연속 운동", emoji: "🔥", tier: "silver", group: "스트릭" },
  { id: "streak-14", name: "2주 항해", desc: "14일 연속 운동", emoji: "⛵", tier: "silver", group: "스트릭" },
  { id: "streak-30", name: "한 달의 기적", desc: "30일 연속 운동", emoji: "🌟", tier: "gold", group: "스트릭" },
  { id: "streak-100", name: "백일의 약속", desc: "100일 연속 운동", emoji: "👑", tier: "legend", group: "스트릭" },

  // 누적
  { id: "total-10", name: "열 번의 시작", desc: "누적 10회 운동", emoji: "🔟", tier: "bronze", group: "누적" },
  { id: "total-50", name: "반백 클럽", desc: "누적 50회 운동", emoji: "🎯", tier: "silver", group: "누적" },
  { id: "total-100", name: "센추리", desc: "누적 100회 운동", emoji: "💯", tier: "gold", group: "누적" },
  { id: "total-365", name: "사계절 러너", desc: "누적 365회 운동", emoji: "🏆", tier: "legend", group: "누적" },
  { id: "hours-10", name: "10시간 적립", desc: "누적 600분 운동", emoji: "⏱️", tier: "bronze", group: "누적" },
  { id: "hours-50", name: "50시간 장인", desc: "누적 3000분 운동", emoji: "⌛", tier: "gold", group: "누적" },

  // 시간대·습관
  { id: "early-bird", name: "얼리버드", desc: "오전 6시 이전 운동 5회", emoji: "🐓", tier: "silver", group: "습관" },
  { id: "night-owl", name: "밤의 수호자", desc: "밤 9시 이후 운동 5회", emoji: "🦉", tier: "silver", group: "습관" },
  { id: "weekend-warrior", name: "주말 전사", desc: "토·일 모두 운동한 주 4번", emoji: "🛡️", tier: "silver", group: "습관" },
  { id: "no-excuse", name: "핑계 없음", desc: "궂은 날씨에도 5회 운동", emoji: "🌧️", tier: "gold", group: "습관" },
  { id: "monthly-perfect", name: "개근왕", desc: "월간 목표 100% 달성", emoji: "📅", tier: "gold", group: "습관" },

  // 종목
  { id: "swimmer", name: "물개", desc: "수영 20회", emoji: "🦭", tier: "silver", group: "종목" },
  { id: "iron", name: "무쇠팔", desc: "헬스 20회", emoji: "💪", tier: "silver", group: "종목" },
  { id: "flexible", name: "유연왕", desc: "요가·필라테스 합계 20회", emoji: "🤸", tier: "silver", group: "종목" },
  { id: "explorer", name: "탐험가", desc: "서로 다른 종목 5가지", emoji: "🧭", tier: "bronze", group: "종목" },
  { id: "all-rounder", name: "만능 스포츠맨", desc: "서로 다른 종목 8가지", emoji: "🎪", tier: "gold", group: "종목" },

  // 센터
  { id: "center-regular", name: "센터 단골", desc: "성북레포츠센터 30회 방문", emoji: "🏛️", tier: "silver", group: "센터" },
  { id: "worth-it", name: "본전 뽑았다", desc: "프로그램 출석률 90% 이상", emoji: "💰", tier: "gold", group: "센터" },
  { id: "program-done", name: "완주", desc: "프로그램 완주 + 출석률 70% 이상", emoji: "🎓", tier: "gold", group: "센터" },

  // 가족
  { id: "family-day", name: "가족 운동의 날", desc: "네 사람 모두 같은 날 운동", emoji: "👨‍👩‍👧‍👦", tier: "gold", group: "가족" },
  { id: "cheerleader", name: "응원단장", desc: "응원 스티커 20개 보내기", emoji: "📣", tier: "bronze", group: "가족" },
  { id: "loved", name: "사랑받는 사람", desc: "응원 스티커 20개 받기", emoji: "💌", tier: "bronze", group: "가족" },
  { id: "leader", name: "이달의 1위", desc: "월간 리더보드 1위", emoji: "🥇", tier: "gold", group: "가족" },

  // 변화
  { id: "photographer", name: "기록 사진가", desc: "인증샷 20장", emoji: "📸", tier: "bronze", group: "변화" },
  { id: "body-tracker", name: "몸의 기록자", desc: "신체 기록 10회", emoji: "📏", tier: "bronze", group: "변화" },
  { id: "clear-mind", name: "맑은 정신", desc: "운동 후 기분 최고 20회", emoji: "🧘", tier: "silver", group: "변화" },
  { id: "transformer", name: "변신", desc: "체중 3kg 이상 변화", emoji: "🦋", tier: "gold", group: "변화" },
];

export const BADGE_MAP = new Map(BADGES.map((b) => [b.id, b]));

export const TIER_STYLE: Record<string, { label: string; ring: string; bg: string }> = {
  bronze: { label: "브론즈", ring: "ring-amber-700/40", bg: "bg-amber-700/15" },
  silver: { label: "실버", ring: "ring-slate-400/50", bg: "bg-slate-400/15" },
  gold: { label: "골드", ring: "ring-yellow-500/50", bg: "bg-yellow-500/15" },
  legend: { label: "레전드", ring: "ring-fuchsia-500/50", bg: "bg-fuchsia-500/15" },
};

/**
 * 현재 상태로 회원이 보유해야 할 배지 목록을 계산한다(멱등).
 * 반환값은 badgeId + 중복 방지 key.
 */
export function evaluateBadges(state: AppState, memberId: MemberId): { badgeId: string; key?: string }[] {
  const earned: { badgeId: string; key?: string }[] = [];
  const logs = logsOf(state, memberId);
  const add = (badgeId: string, key?: string) => earned.push({ badgeId, key });

  if (logs.length === 0 && state.bodyRecords.filter((b) => b.memberId === memberId).length === 0) {
    return earned;
  }

  // 스트릭
  const { current, best } = computeStreak(logs);
  const streakMax = Math.max(current, best);
  if (logs.length >= 1) add("first-step");
  if (streakMax >= 3) add("streak-3");
  if (streakMax >= 7) add("streak-7");
  if (streakMax >= 14) add("streak-14");
  if (streakMax >= 30) add("streak-30");
  if (streakMax >= 100) add("streak-100");

  // 누적
  if (logs.length >= 10) add("total-10");
  if (logs.length >= 50) add("total-50");
  if (logs.length >= 100) add("total-100");
  if (logs.length >= 365) add("total-365");
  const totalMin = logs.reduce((s, l) => s + l.durationMin, 0);
  if (totalMin >= 600) add("hours-10");
  if (totalMin >= 3000) add("hours-50");

  // 시간대
  if (logs.filter((l) => l.startHour !== undefined && l.startHour < 6).length >= 5) add("early-bird");
  if (logs.filter((l) => l.startHour !== undefined && l.startHour >= 21).length >= 5) add("night-owl");
  if (logs.filter((l) => l.rainy).length >= 5) add("no-excuse");

  // 주말 전사
  const dates = activeDates(logs);
  const weekendWeeks = new Set<string>();
  for (const d of dates) {
    if (parseDateStr(d).getDay() === 6 && dates.has(addDays(d, 1))) {
      weekendWeeks.add(startOfWeek(d));
    }
  }
  if (weekendWeeks.size >= 4) add("weekend-warrior");

  // 월간 개근 (월별로 개별 부여)
  const months = new Set(logs.map((l) => monthKey(l.date)));
  for (const ym of months) {
    const s = monthSummary(state, memberId, ym);
    if (s.goal > 0 && s.activeDays >= s.goal) add("monthly-perfect", ym);
  }

  // 종목
  const countBy = (name: string) => logs.filter((l) => l.activity === name).length;
  if (countBy("수영") >= 20) add("swimmer");
  if (countBy("헬스") >= 20) add("iron");
  if (countBy("요가") + countBy("필라테스") >= 20) add("flexible");
  const kinds = new Set(logs.map((l) => l.activity));
  if (kinds.size >= 5) add("explorer");
  if (kinds.size >= 8) add("all-rounder");

  // 센터
  if (logs.filter((l) => l.place === "성북레포츠센터").length >= 30) add("center-regular");
  for (const p of state.programs.filter((p) => p.memberId === memberId)) {
    const st = programStats(state, p);
    if (st.planned > 0 && st.rate >= 0.9) add("worth-it", p.id);
    if (st.finished && st.rate >= 0.7) add("program-done", p.id);
  }

  // 가족
  const fdays = familyDays(state);
  if (fdays.length > 0 && dates.size > 0) add("family-day");
  if (state.cheers.filter((c) => c.fromId === memberId).length >= 20) add("cheerleader");
  if (state.cheers.filter((c) => c.toId === memberId).length >= 20) add("loved");
  // 이달의 1위는 "끝난 달"에만 확정한다 (진행 중 순위는 계속 바뀌므로)
  const thisMonth = todayStr().slice(0, 7);
  for (const ym of months) {
    if (ym >= thisMonth) continue;
    const rows = leaderboard(state, monthDates(ym));
    const competed = rows.filter((r) => r.days > 0).length >= 2;
    if (competed && rows[0].memberId === memberId) add("leader", ym);
  }

  // 변화
  const photoCount = logs.reduce((s, l) => s + l.photoIds.length, 0);
  if (photoCount >= 20) add("photographer");
  const bodies = state.bodyRecords.filter((b) => b.memberId === memberId);
  if (bodies.length >= 10) add("body-tracker");
  if (logs.filter((l) => l.mood === 5).length >= 20) add("clear-mind");
  const weights = bodies.map((b) => b.weightKg).filter((w): w is number => typeof w === "number");
  if (weights.length >= 2) {
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    if (max - min >= 3) add("transformer");
  }

  return earned;
}

/** 새로 획득한 배지만 반환하고, 전체 배지 배열을 갱신한다. */
export function syncBadges(
  state: AppState,
  memberId: MemberId
): { badges: BadgeAward[]; newly: BadgeAward[] } {
  const should = evaluateBadges(state, memberId);
  const existing = state.badges;
  const keyOf = (m: MemberId, id: string, k?: string) => `${m}|${id}|${k ?? ""}`;
  const have = new Set(existing.map((b) => keyOf(b.memberId, b.badgeId, b.key)));
  const newly: BadgeAward[] = [];
  const now = Date.now();
  for (const s of should) {
    if (!have.has(keyOf(memberId, s.badgeId, s.key))) {
      newly.push({ memberId, badgeId: s.badgeId, key: s.key, awardedAt: now });
    }
  }
  return { badges: [...existing, ...newly], newly };
}

export function badgesOf(state: AppState, memberId: MemberId): BadgeAward[] {
  return state.badges
    .filter((b) => b.memberId === memberId)
    .sort((a, b) => b.awardedAt - a.awardedAt);
}

export function earnedBadgeIds(state: AppState, memberId: MemberId): Set<string> {
  return new Set(badgesOf(state, memberId).map((b) => b.badgeId));
}

export { todayStr };
