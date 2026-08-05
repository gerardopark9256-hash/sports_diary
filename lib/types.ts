export type MemberId = "joeun" | "junho" | "grace" | "gerardo";

export type Intensity = 1 | 2 | 3 | 4 | 5;
export type Mood = 1 | 2 | 3 | 4 | 5;
export type Place = "성북레포츠센터" | "집" | "야외" | "기타";
export type Sticker = "🔥" | "👏" | "💪" | "❤️" | "🎉";

export interface Member {
  id: MemberId;
  name: string;
  emoji: string;
  color: string;
  goalText: string;
  weeklyGoal: number;
}

export interface WorkoutLog {
  id: string;
  memberId: MemberId;
  date: string; // YYYY-MM-DD
  programId?: string;
  activity: string;
  place: Place;
  startHour?: number; // 0-23, 얼리버드/밤 배지 판정용
  durationMin: number;
  intensity: Intensity;
  mood: Mood;
  memo?: string;
  rainy?: boolean;
  photoIds: string[];
  createdAt: number;
}

export interface Program {
  id: string;
  memberId: MemberId;
  title: string;
  center: string;
  startDate: string;
  endDate: string;
  weekdays: number[]; // 0=일 ~ 6=토
  timeLabel?: string;
  price: number;
  targetCount?: number;
  active: boolean;
}

export interface BodyRecord {
  id: string;
  memberId: MemberId;
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  muscleKg?: number;
  note?: string;
  photoIds: string[];
}

export interface BadgeAward {
  memberId: MemberId;
  badgeId: string;
  awardedAt: number;
  key?: string; // 월간 등 반복 배지의 중복 방지 키
}

export interface Cheer {
  id: string;
  fromId: MemberId;
  toId: MemberId;
  date: string;
  sticker: Sticker;
  createdAt: number;
}

export interface AppSettings {
  familyMonthlyGoal: number;
  lastBackupAt?: number;
}

export interface AppState {
  version: number;
  currentMemberId: MemberId | null;
  members: Member[];
  logs: WorkoutLog[];
  programs: Program[];
  bodyRecords: BodyRecord[];
  badges: BadgeAward[];
  cheers: Cheer[];
  settings: AppSettings;
}

export type BadgeTier = "bronze" | "silver" | "gold" | "legend";

export interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  tier: BadgeTier;
  group: string;
}
