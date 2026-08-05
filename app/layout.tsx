import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import BadgeToast from "@/components/BadgeToast";

export const metadata: Metadata = {
  title: "우리가족 운동 다이어리",
  description: "조은·준호·그레이스·제라도의 운동 기록. 몸을 튼튼하게, 정신을 맑게.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "운동 다이어리", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#2f7de1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <StoreProvider>
          <div className="mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>
          <BadgeToast />
        </StoreProvider>
        {process.env.NEXT_PUBLIC_KAKAO_JS_KEY ? (
          <Script
            src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
            integrity="sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
