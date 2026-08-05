# 우리가족 운동 다이어리 🏅

조은 · 준호 · 그레이스 · 제라도 네 사람을 위한 모바일 웹 운동 트래킹 다이어리.
성북레포츠센터 프로그램 관리 · 캘린더 히트맵 · 배지 33종 · 사진 · 카카오톡 공유.

> 몸을 튼튼하게, 정신을 맑게.

## 문서

| 파일 | 내용 |
|------|------|
| [intro.md](./intro.md) | 프로젝트 소개, 사용 흐름, 기능 요약 |
| [problem.md](./problem.md) | 해결하려는 문제, 비목표, 리스크 |
| [spec.md](./spec.md) | 기능 명세, 데이터 모델, 화면·배지 규칙 |

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

## Vercel 배포

```bash
npm i -g vercel   # 아직 없다면
vercel            # 프리뷰 배포
vercel --prod     # 프로덕션 배포
```

GitHub에 올린 뒤 Vercel 대시보드에서 Import 해도 됩니다. 프레임워크는 자동으로 Next.js로 인식됩니다.

### 카카오톡 공유 (선택)

키가 없어도 공유 버튼은 동작합니다 (휴대폰 기본 공유창 → 카카오톡 선택, 안 되면 클립보드 복사).
카카오톡으로 **바로 전송**하려면:

1. [카카오 개발자 콘솔](https://developers.kakao.com)에서 앱 생성 → **JavaScript 키** 복사
2. Vercel 프로젝트 → Settings → Environment Variables에 추가
   ```
   NEXT_PUBLIC_KAKAO_JS_KEY = <JavaScript 키>
   ```
3. 콘솔 → 앱 설정 → 플랫폼 → **Web**에 배포 주소(`https://xxx.vercel.app`) 등록
4. 재배포

로컬에서 쓰려면 `.env.local` 파일에 같은 줄을 넣으세요.

## 데이터 보관 주의

기록은 **접속한 기기의 브라우저(localStorage + IndexedDB)** 에만 저장됩니다.
서버도 계정도 없어서 빠르고 안전하지만, 브라우저 데이터를 지우면 기록도 사라집니다.

- 가족이 **한 대의 기기**(공용 태블릿/폰)에서 쓰는 것을 권장
- 각자 폰에서 쓴다면 **설정 → 데이터 백업 → 내보내기(JSON)** 로 저장 후,
  한 기기에서 **가져오기(합치기)** 하면 가족 화면이 합쳐집니다
- 한 달에 한 번 백업을 권장 (30일 넘으면 설정 화면에 경고가 뜹니다)

## 홈 화면에 추가 (PWA)

- iPhone: Safari → 공유 → "홈 화면에 추가"
- Android: Chrome → ⋮ → "홈 화면에 추가"

## 구조

```
app/        페이지 (홈·캘린더·프로그램·변화·배지·가족·설정)
components/ UI 컴포넌트 (캘린더, 시트, 차트, 사진, 배지 모달)
lib/        도메인 로직 (배지 엔진, 통계·스트릭, 저장소, 사진, 공유)
public/     PWA manifest, 아이콘
```

## 기술 스택

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · localStorage/IndexedDB · Vercel
