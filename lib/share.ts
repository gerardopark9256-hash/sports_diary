declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

export type ShareResult = "kakao" | "webshare" | "clipboard" | "failed";

function kakaoReady(): boolean {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key || typeof window === "undefined" || !window.Kakao) return false;
  try {
    if (!window.Kakao.isInitialized()) window.Kakao.init(key);
    return window.Kakao.isInitialized();
  } catch {
    return false;
  }
}

export interface ShareCard {
  title: string;
  description: string;
  link?: string;
}

/**
 * 카카오 → Web Share → 클립보드 순으로 폴백하며 공유한다.
 */
export async function shareCard(card: ShareCard): Promise<ShareResult> {
  const link =
    card.link ?? (typeof window !== "undefined" ? window.location.origin : "https://vercel.com");
  const text = `${card.title}\n${card.description}`;

  if (kakaoReady()) {
    try {
      window.Kakao!.Share.sendDefault({
        objectType: "text",
        text,
        link: { mobileWebUrl: link, webUrl: link },
        buttonTitle: "운동 다이어리 열기",
      });
      return "kakao";
    } catch {
      /* 폴백 계속 */
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: card.title, text, url: link });
      return "webshare";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${link}`);
    return "clipboard";
  } catch {
    return "failed";
  }
}

export function workoutShareText(opts: {
  name: string;
  activity: string;
  durationMin: number;
  streak: number;
  date: string;
}): ShareCard {
  return {
    title: `💪 ${opts.name}님의 오늘 운동`,
    description: `${opts.activity} ${opts.durationMin}분 완료! 🔥 연속 ${opts.streak}일차 (${opts.date})`,
  };
}

export function monthlyShareText(opts: {
  name: string;
  ym: string;
  activeDays: number;
  totalMin: number;
  badges: number;
}): ShareCard {
  const [y, m] = opts.ym.split("-");
  return {
    title: `📊 ${opts.name}님의 ${y}년 ${Number(m)}월 운동 리포트`,
    description: `${opts.activeDays}일 운동 · 총 ${Math.round(opts.totalMin / 60)}시간 · 배지 ${opts.badges}개 🏅`,
  };
}

export function badgeShareText(opts: { name: string; badgeName: string; emoji: string }): ShareCard {
  return {
    title: `🏅 배지 획득!`,
    description: `${opts.name}님이 "${opts.emoji} ${opts.badgeName}" 배지를 얻었어요!`,
  };
}
