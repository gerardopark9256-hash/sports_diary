export const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function diffDays(a: string, b: string): number {
  const ms = parseDateStr(a).getTime() - parseDateStr(b).getTime();
  return Math.round(ms / 86400000);
}

/** 해당 날짜가 속한 주(월요일 시작)의 월요일 */
export function startOfWeek(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const day = d.getDay(); // 0=일
  const back = day === 0 ? 6 : day - 1;
  return addDays(dateStr, -back);
}

export function weekDates(dateStr: string): string[] {
  const mon = startOfWeek(dateStr);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** YYYY-MM 의 모든 날짜 */
export function monthDates(ym: string): string[] {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return Array.from({ length: last }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`);
}

/** 캘린더 그리드용: 앞 빈칸 개수(일요일 시작) */
export function leadingBlanks(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).getDay();
}

export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return todayStr().slice(0, 7);
}

export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}년 ${Number(m)}월`;
}

export function formatDateKo(dateStr: string): string {
  const d = parseDateStr(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`;
}

/** 기간 내 지정 요일이 몇 번 등장하는지 */
export function countWeekdaysBetween(start: string, end: string, weekdays: number[]): number {
  if (!weekdays.length) return 0;
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    if (weekdays.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function daysUntil(dateStr: string): number {
  return diffDays(dateStr, todayStr());
}
