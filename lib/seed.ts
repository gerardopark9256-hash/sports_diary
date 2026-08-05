import type { AppState, Member } from "./types";

export const STORAGE_KEY = "familySportsDiary.v1";
export const STATE_VERSION = 1;

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: "joeun",
    name: "조은",
    emoji: "🌷",
    color: "#e8618c",
    goalText: "가볍고 맑게, 주 3회 꾸준히",
    weeklyGoal: 3,
  },
  {
    id: "junho",
    name: "준호",
    emoji: "🐯",
    color: "#2f7de1",
    goalText: "근력 키우고 체력 회복",
    weeklyGoal: 4,
  },
  {
    id: "grace",
    name: "그레이스",
    emoji: "🦋",
    color: "#8b5cf6",
    goalText: "유연함과 균형, 스트레스 해소",
    weeklyGoal: 3,
  },
  {
    id: "gerardo",
    name: "제라도",
    emoji: "🦁",
    color: "#f59e0b",
    goalText: "매일 몸을 움직이는 습관",
    weeklyGoal: 4,
  },
];

export const ACTIVITY_PRESETS = [
  { name: "수영", emoji: "🏊" },
  { name: "헬스", emoji: "🏋️" },
  { name: "필라테스", emoji: "🤸" },
  { name: "요가", emoji: "🧘" },
  { name: "배드민턴", emoji: "🏸" },
  { name: "탁구", emoji: "🏓" },
  { name: "스피닝", emoji: "🚴" },
  { name: "걷기", emoji: "🚶" },
  { name: "달리기", emoji: "🏃" },
  { name: "등산", emoji: "⛰️" },
  { name: "아쿠아로빅", emoji: "💦" },
  { name: "홈트", emoji: "🏠" },
];

export function activityEmoji(name: string): string {
  return ACTIVITY_PRESETS.find((a) => a.name === name)?.emoji ?? "✨";
}

export const CENTER_NAME = "성북레포츠센터";

export const QUOTES = [
  "오늘의 1시간이 내일의 나를 만든다.",
  "몸이 가벼워지면 마음도 맑아진다.",
  "가장 어려운 건 시작이 아니라 계속이다.",
  "땀은 배신하지 않는다.",
  "쉬어도 좋다. 다만 그만두지는 말자.",
  "어제의 나보다 딱 1%만.",
  "운동은 몸에 주는 가장 착한 선물.",
  "숨이 차오를 때 진짜 시작이다.",
  "가족이 함께라면 더 멀리 간다.",
  "기록하지 않으면 사라진다.",
  "느려도 괜찮다. 멈추지만 않으면.",
  "오늘 흘린 땀이 내일의 자신감.",
  "머리가 복잡할수록 몸을 움직여라.",
  "건강은 저축이다. 오늘도 한 번 입금.",
];

export function quoteOfDay(dateStr: string): string {
  let sum = 0;
  for (let i = 0; i < dateStr.length; i++) sum += dateStr.charCodeAt(i);
  return QUOTES[sum % QUOTES.length];
}

export function initialState(): AppState {
  return {
    version: STATE_VERSION,
    currentMemberId: null,
    members: DEFAULT_MEMBERS,
    logs: [],
    programs: [],
    bodyRecords: [],
    badges: [],
    cheers: [],
    settings: { familyMonthlyGoal: 40 },
  };
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
