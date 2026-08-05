# 기능 명세서 (Specification)

프로젝트: **우리가족 운동 다이어리 (Family Sports Diary)**
버전: v1.0
대상: 조은 · 준호 · 그레이스 · 제라도

---

## 1. 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | Vercel 배포 최적, 파일 기반 라우팅 |
| 언어 | TypeScript | 데이터 모델이 많아 타입 안정성 필요 |
| 스타일 | Tailwind CSS v4 | 모바일 유틸리티 클래스, 빌드 단순 |
| 상태 | React Context + useReducer | 외부 상태 라이브러리 불필요한 규모 |
| 저장소 | localStorage (구조 데이터) / IndexedDB (사진) | 서버 없음, 오프라인 동작 |
| 차트 | 자체 SVG 컴포넌트 | 의존성 최소화, 번들 경량 |
| 공유 | Kakao JS SDK + Web Share API 폴백 | 가족이 실제 쓰는 채널 |
| PWA | manifest.json + 아이콘 | 홈 화면 추가 |
| 배포 | Vercel | `npm run build` → 자동 배포 |

**렌더링 원칙**: 모든 데이터가 브라우저에 있으므로 데이터 페이지는 `"use client"`.
SSR/하이드레이션 불일치 방지를 위해 저장소 읽기는 반드시 `useEffect` 이후에 수행하고,
그 전에는 스켈레톤을 노출한다.

---

## 2. 정보 구조 (Information Architecture)

```
/                     첫 실행 → 프로필 선택 / 이후 → /home 자동 리다이렉트
/home                 오늘 요약 · 스트릭 · 이번 달 진행 · 빠른 기록
/calendar             월간 캘린더 히트맵 · 날짜별 기록 편집
/programs             성북레포츠센터 프로그램 등록 관리
/progress             신체 변화 그래프 · 마음 점수 · Before/After
/badges               배지 진열장
/family               가족 리더보드 · 가족 챌린지 · 응원
/settings             프로필 전환 · 데이터 백업/복원 · 카카오 키 안내
```

하단 고정 탭바 5개: **홈 / 캘린더 / 프로그램 / 변화 / 가족**
(배지·설정은 홈 상단 아이콘으로 진입)

---

## 3. 데이터 모델

```ts
// 고정 4인
type MemberId = "joeun" | "junho" | "grace" | "gerardo";

interface Member {
  id: MemberId;
  name: string;          // 조은, 준호, 그레이스, 제라도
  emoji: string;         // 프로필 대체 아바타
  color: string;         // 테마 색 (hex)
  goalText: string;      // 개인 목표 한 줄
  weeklyGoal: number;    // 주간 목표 운동 횟수 (기본 3)
}

type Intensity = 1 | 2 | 3 | 4 | 5;   // 히트맵 농도
type Mood = 1 | 2 | 3 | 4 | 5;        // 운동 후 기분

interface WorkoutLog {
  id: string;
  memberId: MemberId;
  date: string;          // "YYYY-MM-DD" (로컬 기준)
  programId?: string;    // 센터 프로그램과 연결 시
  activity: string;      // 수영, 헬스, 필라테스, 배드민턴, 걷기, 요가, 등산 ...
  place: "성북레포츠센터" | "집" | "야외" | "기타";
  durationMin: number;   // 운동 시간(분)
  intensity: Intensity;
  mood: Mood;            // 운동 후 상쾌함
  memo?: string;
  photoIds: string[];    // IndexedDB 키
  createdAt: number;
}

interface Program {           // 센터에서 결제한 강습/이용권
  id: string;
  memberId: MemberId;
  title: string;             // "성인 수영 초급"
  center: string;            // 기본 "성북레포츠센터"
  startDate: string;         // "YYYY-MM-DD"
  endDate: string;
  weekdays: number[];        // 0(일)~6(토)
  timeLabel?: string;        // "06:00~06:50"
  price: number;             // 결제 금액(원)
  targetCount?: number;      // 미입력 시 기간×요일로 자동 계산
  active: boolean;
}

interface BodyRecord {
  id: string;
  memberId: MemberId;
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
  muscleKg?: number;
  note?: string;
  photoIds: string[];        // 인바디 사진 / 바디 프로필
}

interface BadgeAward {
  memberId: MemberId;
  badgeId: string;
  awardedAt: number;         // epoch ms
  month?: string;            // "YYYY-MM" (월간 배지 중복 방지 키)
}

interface Cheer {                 // 가족 응원 스티커
  id: string;
  fromId: MemberId;
  toId: MemberId;
  date: string;                   // 응원 대상 날짜
  sticker: "🔥" | "👏" | "💪" | "❤️" | "🎉";
  createdAt: number;
}

interface AppState {
  currentMemberId: MemberId | null;   // 선택 기억 (P5 해결)
  members: Member[];
  logs: WorkoutLog[];
  programs: Program[];
  bodyRecords: BodyRecord[];
  badges: BadgeAward[];
  cheers: Cheer[];
  freezesUsed: Record<string, string[]>;  // memberId → 프리즈 사용 날짜들
  settings: { kakaoReady: boolean; lastBackupAt?: number };
  version: number;                    // 마이그레이션용
}
```

**저장 키**: `familySportsDiary.v1` (localStorage, JSON 직렬화)
**사진**: IndexedDB DB `fsd-photos`, store `photos`, `{ id, blobDataUrl, createdAt }`

---

## 4. 화면 명세

### 4.1 `/` 프로필 선택 (첫 실행 전용)

- 4장의 큰 카드(2×2 그리드). 각 카드에 이모지 아바타 · 이름 · 개인 색상.
- 카드 탭 → `currentMemberId` 저장 → `/home`으로 이동.
- **재방문 시**: `currentMemberId`가 있으면 즉시 `/home`으로 리다이렉트 (P5).
- 하단 작은 텍스트: "다른 사람으로 바꾸려면 홈 상단 프로필을 누르세요."

### 4.2 `/home` 메인

| 블록 | 내용 |
|------|------|
| 헤더 | 아바타 + "조은님, 오늘도 맑게 💪" · 배지/설정 아이콘 |
| 스트릭 카드 | 🔥 연속 N일 · 최장 기록 · 남은 프리즈 개수 |
| 오늘 기록 | 오늘 기록 있으면 요약 카드, 없으면 **[+ 오늘 운동 기록하기]** 큰 버튼 |
| 이번 달 진행 | 원형 게이지: 이번 달 운동일 / 월간 목표 (주간목표×4.3 반올림) |
| 진행 중 프로그램 | 프로그램별 출석 N/M, 1회당 단가, 진행바 |
| 이번 주 미니 캘린더 | 월~일 7칸, 운동한 날 색칠 |
| 최근 배지 | 최근 획득 3개 |
| 오늘의 한마디 | 날짜 기반 결정적 선택(랜덤 아님 → 하이드레이션 안전) |

### 4.3 `/calendar` 캘린더

- 월 이동(◀ 2026.08 ▶). 요일 헤더 일~토.
- 각 날짜 셀: 운동 기록 있으면 **강도에 따른 5단계 농도** 배경 + 종목 이모지.
  사진 있으면 우상단 점, 응원 받았으면 하단 스티커.
- 날짜 탭 → 하단 시트로 기록 편집/추가/삭제.
- 상단 월간 요약: 운동일 · 총 시간 · 평균 강도 · 평균 기분.
- **기록 입력 시트(3탭 완료 원칙, P6)**
  1. 종목 선택 (자주 쓰는 종목 칩 8개 + 직접입력)
  2. 시간·강도 (프리셋 30/50/60/90분, 강도 5단계 슬라이더)
  3. 저장 → 나머지(기분/장소/메모/사진)는 선택 입력 영역

### 4.4 `/programs` 프로그램 관리

- 카드 리스트: 제목 · 기간 · 요일/시간 · 결제액.
- 자동 계산 지표
  - `예정 횟수` = 기간 내 지정 요일 수 (targetCount 미입력 시)
  - `출석 횟수` = 해당 programId 로그 수
  - `출석률` = 출석/예정
  - **`1회당 단가` = price ÷ max(출석,1)** ← P2의 핵심 지표. 강조 표시.
  - `남은 회차`, `종료까지 D-day`
- 출석률 60% 미만이면 경고색 + "이번 주 2번 더 가면 본전!" 코칭 문구.
- 신규 등록 폼: 제목/기간/요일 토글/시간/금액.
- 기본 종목 프리셋: 수영, 헬스, 필라테스, 배드민턴, 요가, 스피닝, 탁구, 아쿠아로빅.

### 4.5 `/progress` 변화

- **체중/체지방/근육량 라인 차트** (자체 SVG, 최근 12개 기록)
- **마음 점수**: 월별 평균 기분 → 막대 그래프 + "정신 맑음 지수 4.2/5"
- **운동량 추이**: 최근 6개월 월별 운동일 막대
- **Before/After**: 사진 2장 선택 → 좌우 슬라이더 비교
- 신체 기록 추가 폼 (체중·체지방·근육량·메모·사진)
- 종목 분포 도넛(어떤 운동을 가장 많이 했나)

### 4.6 `/badges` 배지 진열장

- 획득/미획득 그리드. 미획득은 실루엣 + 조건 문구.
- 티어별 섹션: 브론즈 / 실버 / 골드 / 레전드.
- 배지 탭 → 상세(조건, 획득일, 카카오 공유).

### 4.7 `/family` 가족

- **주간 리더보드**: 이번 주 운동 횟수/시간 순위, 1위 왕관.
- **가족 챌린지**: 이번 달 가족 합산 목표(기본 40회) 진행바 + 각자 기여도 스택바.
- **응원**: 가족 최근 기록 피드 → 스티커 5종 중 하나 남기기.
- **가족 스트릭**: 4명 모두 운동한 날 수.

### 4.8 `/settings`

- 프로필 전환(4인 카드) · 이름/이모지/색/목표/주간 목표 수정
- **데이터 백업**: JSON 내보내기(다운로드) / 가져오기(병합·덮어쓰기 선택)
- 저장 용량 표시, 마지막 백업일, 30일 넘으면 경고
- 카카오 공유 설정 안내 (`NEXT_PUBLIC_KAKAO_JS_KEY`)
- 전체 초기화(2단계 확인)

---

## 5. 배지 시스템

### 판정 시점
운동 기록 저장/삭제, 신체 기록 저장 시 전체 배지 규칙을 재평가한다(멱등).
새로 획득한 배지는 토스트 + 획득 모달로 알린다.

### 배지 목록 (v1: 33종)

**스트릭 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| first-step | 첫걸음 | 첫 운동 기록 | 브론즈 |
| streak-3 | 삼일의 벽 돌파 | 3일 연속 | 브론즈 |
| streak-7 | 일주일 전사 | 7일 연속 | 실버 |
| streak-14 | 2주 항해 | 14일 연속 | 실버 |
| streak-30 | 한 달의 기적 | 30일 연속 | 골드 |
| streak-100 | 백일의 약속 | 100일 연속 | 레전드 |

**누적 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| total-10 | 열 번의 시작 | 누적 10회 | 브론즈 |
| total-50 | 반백 클럽 | 누적 50회 | 실버 |
| total-100 | 센추리 | 누적 100회 | 골드 |
| total-365 | 사계절 러너 | 누적 365회 | 레전드 |
| hours-10 | 10시간 적립 | 누적 600분 | 브론즈 |
| hours-50 | 50시간 장인 | 누적 3000분 | 골드 |

**시간대·습관 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| early-bird | 얼리버드 | 06시 이전 시작 기록 5회 | 실버 |
| night-owl | 밤의 수호자 | 21시 이후 기록 5회 | 실버 |
| weekend-warrior | 주말 전사 | 토·일 모두 운동한 주 4번 | 실버 |
| no-excuse | 핑계 없음 | 비 오는 날에도(사용자 체크) 5회 | 골드 |
| monthly-perfect | 개근왕 | 한 달 목표 100% 달성 | 골드 |

**종목 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| swimmer | 물개 | 수영 20회 | 실버 |
| iron | 무쇠팔 | 헬스 20회 | 실버 |
| flexible | 유연왕 | 요가/필라테스 20회 | 실버 |
| explorer | 탐험가 | 서로 다른 종목 5가지 | 브론즈 |
| all-rounder | 만능 스포츠맨 | 서로 다른 종목 8가지 | 골드 |

**성북레포츠센터 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| center-regular | 센터 단골 | 성북레포츠센터 30회 | 실버 |
| worth-it | 본전 뽑았다 | 프로그램 출석률 90% 이상 달성 | 골드 |
| program-done | 완주 | 프로그램 기간 완주 + 출석률 70%↑ | 골드 |

**가족·사회 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| family-day | 가족 운동의 날 | 4명 모두 같은 날 운동 | 골드 |
| cheerleader | 응원단장 | 응원 스티커 20개 보내기 | 브론즈 |
| loved | 사랑받는 사람 | 응원 스티커 20개 받기 | 브론즈 |
| leader | 이달의 1위 | **끝난 달**의 리더보드 1위 (2명 이상 참여한 달만) | 골드 |

**변화·기록 계열**
| ID | 이름 | 조건 | 티어 |
|----|------|------|------|
| photographer | 기록 사진가 | 인증샷 20장 | 브론즈 |
| body-tracker | 몸의 기록자 | 신체 기록 10회 | 브론즈 |
| clear-mind | 맑은 정신 | 기분 5점 기록 20회 | 실버 |
| transformer | 변신 | 체중 기록 3kg 이상 변화 | 골드 |

### 스트릭 규칙 (P9)
- 연속일 = 오늘 또는 어제부터 역순으로 기록이 이어지는 일수.
- **프리즈**: ISO 주(월~일) 기준 주 1회, 하루 공백을 메워 연속을 유지.
  자동 적용하되 홈 카드에 "프리즈 사용됨 🧊"으로 명시.

---

## 6. 카카오톡 공유

```
설정: 환경변수 NEXT_PUBLIC_KAKAO_JS_KEY (Vercel Project Settings에 추가)
로드: https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js (next/script, afterInteractive)
```

**공유 종류**
1. **오늘의 운동 카드** — "조은님이 오늘 수영 50분 🔥 연속 12일차!"
2. **월간 리포트 카드** — "8월 14회 운동 · 출석률 87% · 배지 3개 획득"
3. **배지 획득 카드** — "🏅 일주일 전사 배지 획득!"

**폴백 순서** (P4·리스크 대응)
1. Kakao SDK 준비됨 → `Kakao.Share.sendDefault` (텍스트 템플릿)
2. 아니면 `navigator.share` (모바일 기본 공유 시트 → 카카오톡 선택 가능)
3. 아니면 `navigator.clipboard.writeText` + "복사했어요, 카톡에 붙여넣기" 토스트

> 사진 자체는 로컬 blob이라 카카오 서버가 못 읽는다.
> v1은 **텍스트 카드 공유**로 하고, 사진 공유는 Web Share API의 `files`가
> 지원되는 기기에서만 함께 전송한다.

---

## 7. 사진 처리

1. `<input type="file" accept="image/*" capture="environment">`
2. 캔버스로 리사이즈: 긴 변 최대 **1080px**, JPEG **quality 0.7**
3. dataURL로 IndexedDB(`fsd-photos`) 저장, 로그에는 `photoId`만 보관
4. 삭제 시 참조 없는 사진도 함께 삭제(고아 정리)
5. 표시 시 지연 로딩(`loading="lazy"`)

---

## 8. 모바일 UX 규칙

- 최대 폭 **480px 중앙 정렬**, 하단 탭바 고정(`env(safe-area-inset-bottom)` 반영)
- 터치 타깃 최소 **44×44px**
- 폼 입력 `font-size: 16px` 이상 (iOS 자동 확대 방지)
- 숫자 입력은 `inputMode="numeric"`
- 주요 액션은 화면 하단 1/3 영역(엄지존)
- 다크 모드: `prefers-color-scheme` 대응
- 로딩 중 레이아웃 시프트 방지용 스켈레톤

---

## 9. 파일 구조

```
app/
  layout.tsx            루트 레이아웃 + Providers + Kakao 스크립트
  page.tsx              프로필 선택 / 리다이렉트
  home/page.tsx
  calendar/page.tsx
  programs/page.tsx
  progress/page.tsx
  badges/page.tsx
  family/page.tsx
  settings/page.tsx
  globals.css
components/
  AppShell.tsx  TabBar.tsx  Header.tsx
  WorkoutSheet.tsx  CalendarGrid.tsx  StreakCard.tsx
  ProgramCard.tsx  BadgeGrid.tsx  LineChart.tsx  BarChart.tsx  DonutChart.tsx
  BeforeAfter.tsx  PhotoPicker.tsx  Toast.tsx  Modal.tsx  ProgressRing.tsx
lib/
  types.ts  store.tsx  storage.ts  photos.ts
  badges.ts  stats.ts  date.ts  share.ts  seed.ts
public/
  manifest.json  icon-192.png  icon-512.png
```

---

## 10. 배포 (Vercel)

```bash
npm install
npm run build          # 타입/빌드 오류 0 이어야 함
npx vercel --prod      # 또는 GitHub 연동 후 자동 배포
```

환경변수(선택): `NEXT_PUBLIC_KAKAO_JS_KEY`
카카오 개발자 콘솔 → 플랫폼 → Web → 사이트 도메인에 Vercel 배포 URL 등록 필요.

---

## 11. 수용 기준 (Acceptance Criteria)

- [ ] 첫 실행 시 4명 카드가 보이고, 선택하면 홈으로 간다
- [ ] 앱을 껐다 켜도 프로필 선택 화면이 다시 뜨지 않는다
- [ ] 캘린더에서 날짜를 눌러 3탭 안에 운동을 기록할 수 있다
- [ ] 기록한 날짜가 캘린더에 강도별 색으로 표시된다
- [ ] 프로그램 등록 후 출석률과 1회당 단가가 자동 계산된다
- [ ] 조건 충족 시 배지가 즉시 부여되고 모달로 알려준다
- [ ] 스트릭이 정확히 계산되고, 프리즈가 주 1회 적용된다
- [ ] 사진을 첨부하면 압축되어 저장되고 다시 볼 수 있다
- [ ] 카카오 키가 없어도 공유 버튼이 폴백으로 동작한다
- [ ] 가족 리더보드에 4명 순위가 나온다
- [ ] JSON 내보내기/가져오기로 데이터가 보존된다
- [ ] 모바일(390px)에서 가로 스크롤이 발생하지 않는다
- [ ] `npm run build`가 오류 없이 통과한다

---

## 12. 향후 로드맵 (v2 이후)

- 가족 간 실시간 동기화 (Vercel 마켓플레이스 DB 연동)
- 성북레포츠센터 프로그램 일정 캘린더 가져오기
- 운동 루틴/세트 기록 (무게 × 횟수 × 세트)
- 푸시 알림 (운동 요일 아침 리마인더)
- 연간 결산 "우리 가족 2026 스포츠 어워드"
