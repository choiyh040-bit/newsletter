# CardGen AI

키워드나 기사 URL을 넣으면 인스타그램 카드뉴스(1080×1350, 4:5) 4~5장을 만들고
PNG로 내려받는 웹앱입니다.

## 동작 방식

```
홈(/)  →  로딩(/loading)  →  미리보기(/preview)
              ↓
      POST /api/generate
              ↓
  기사 본문 읽기 → Gemini(검색 도구) → 카드 데이터
```

생성 결과는 `sessionStorage`에 담아 다음 화면으로 넘깁니다. 서버에 저장하지
않으므로 새로고침하면 사라집니다.

## 만들 때 지키는 규칙

`src/app/api/generate/route.ts`의 프롬프트와 `src/lib/cardnews.ts`의 검증에
들어 있습니다.

- 기사 URL을 주면 그 본문을 1차 근거로 삼고, 검색은 보조 확인용으로만 씁니다.
- 원문 문장을 그대로 옮기지 않고 다시 씁니다. 직접인용은 15단어 미만으로
  세트당 한 번만 씁니다.
- 헤드라인과 본문은 문자열이 아니라 **줄 배열**로 받습니다. 배열의 한 원소가
  화면의 한 줄이 됩니다. 브라우저 자동 줄바꿈에 맡기면 "~습니다" 같은
  서술어가 혼자 남기 때문입니다.
- 배경은 출처가 불분명한 사진 대신 포인트 컬러 그라데이션과 타이포그래피로
  채웁니다.

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY 채우기
npm run dev                  # http://localhost:3000
```

`GEMINI_API_KEY`는 [Google AI Studio](https://aistudio.google.com/apikey)에서
발급받습니다. 없으면 화면은 뜨지만 생성 요청이 500으로 실패합니다.

## 배포 (Vercel)

1. [vercel.com/new](https://vercel.com/new)에서 이 GitHub 저장소를 Import 합니다.
   Next.js는 자동으로 인식되므로 빌드 설정은 건드릴 필요가 없습니다.
2. **Environment Variables**에 `GEMINI_API_KEY`를 추가합니다.
   Production / Preview / Development 세 곳 모두 체크하세요.
3. Deploy를 누릅니다.

환경변수를 나중에 추가했다면 **재배포해야 반영됩니다**. 기존 배포에는
적용되지 않습니다.

### vercel.json

저장소의 `vercel.json`이 `"framework": "nextjs"`를 지정합니다. 이 값은 Vercel
대시보드의 Framework Preset 설정보다 우선합니다.

이 파일이 없고 대시보드 설정이 `Other`이면, Vercel은 `next build`를 돌려
빌드는 성공시키지만 그 결과물 대신 `public/` 폴더를 정적 사이트로 서빙합니다.
`public/`에는 `index.html`이 없으므로 모든 경로가 `NOT_FOUND`로 404가 됩니다.
빌드가 성공했는데 사이트가 404인 증상이면 이 설정부터 확인하세요.

`/api/generate`는 검색과 생성을 함께 하느라 20~40초가 걸립니다. 그래서
`maxDuration`을 60초로 잡아두었습니다(`src/app/api/generate/route.ts`).
Vercel 요금제별 함수 실행 시간 상한을 넘으면 이 값과 무관하게 잘리므로,
타임아웃이 나면 요금제 상한부터 확인하세요.

## 폰트

카드에 쓰는 [원티드산스](https://github.com/wanteddev/wanted-sans)를
`public/fonts/`에 함께 넣어 두었습니다(OFL-1.1, `public/fonts/OFL.txt`).

CDN에서 불러오지 않고 저장소에 두는 이유는 PNG로 내보낼 때입니다. 카드를
이미지로 구우려면 폰트를 파일 안에 심어야 하는데, 다른 출처에서 받은 폰트는
CORS 때문에 글자가 깨질 수 있습니다.

## 주요 파일

| 경로 | 하는 일 |
| --- | --- |
| `src/app/api/generate/route.ts` | 기사 읽기 + Gemini 호출 + 형식 검증/재시도 |
| `src/lib/cardnews.ts` | 카드 규격, 데이터 타입, 모델 응답 정리 |
| `src/components/CardNewsCard.tsx` | 카드 한 장(1080×1350) 렌더링 |
| `src/lib/exportCards.ts` | 카드 DOM을 PNG/ZIP으로 내보내기 |
| `src/app/preview/page.tsx` | 미리보기 화면과 내보내기 버튼 |
