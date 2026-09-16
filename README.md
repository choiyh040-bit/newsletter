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

생성 결과는 브라우저의 `localStorage`에 최대 20건까지 보관합니다
(`src/lib/cardNewsStore.ts`). 결과마다 id가 있어 `/preview?id=...` 주소로
다시 열 수 있고, 새로고침하거나 브라우저를 껐다 켜도 남습니다.

서버에 저장하지는 않습니다. 그래서 다른 기기나 다른 사람과는 공유되지
않습니다. 링크 공유가 필요해지면 데이터베이스가 필요합니다.

## 만들 때 지키는 규칙

규칙의 원본은 `.claude/skills/mice-cardnews/SKILL.md`입니다. 코드를 고칠 때는
그 문서를 먼저 읽으세요. 아래는 각 규칙이 실제로 어디에 구현돼 있는지입니다.

| 규칙 (SKILL.md) | 구현 위치 |
| --- | --- |
| 원문 베끼지 않고 패러프레이즈 | `api/generate/route.ts` 프롬프트 `[문장 규칙]` |
| 직접인용 15단어 미만, 세트당 1회 | 〃 |
| 관계자 코멘트는 요약체로 | 〃 |
| 카드 4~5장 (표지 + 상세 + 마무리) | 프롬프트 `[구성]`, `cardnews.ts`의 `MIN_SLIDES`/`MAX_SLIDES` |
| 보도용·유료 스톡 이미지 사용 금지 | 사진을 아예 쓰지 않음. `CardNewsCard.tsx`가 그라데이션으로 대체 |
| 캔버스 1080 × 1350 (4:5) | `cardnews.ts`의 `CARD_WIDTH`/`CARD_HEIGHT` |
| 원티드산스 | `public/fonts/`, `globals.css`의 `@font-face`. 명조 템플릿은 나눔명조 |
| 좌상단 카테고리 배지 | 각 템플릿 (`src/components/templates/`) |
| 중앙 반투명 다크 카드 위 흰 텍스트 | `GradientCenter.tsx` (`rgba(10,14,20,0.58)`) |
| 세트 전체를 포인트 컬러 하나로 통일 | `lib/templates/color.ts` — 색상은 고정, 명도만 장별로 변화 |
| 표지는 작은 소제목 → 큰 헤드라인 | 각 템플릿의 `isCover` 분기 |
| 한글 줄바꿈을 직접 끊기 | 헤드라인·본문을 **줄 배열**로 받음 (`CardSlide.heading`, `.body`) |
| 캡션 3~5줄 + 출처 표기 | 프롬프트 JSON 구조의 `caption`, `source` |
| 저장 위치 `YYYY-MM-DD-제목` | `preview/page.tsx`의 `baseName` (PNG/ZIP 파일명) |

SKILL.md는 `<br>` 태그로 줄을 끊으라고 하지만, 여기서는 **줄 배열**을 씁니다.
효과는 같으면서 HTML을 문자열로 주입하지 않아도 되기 때문입니다.

아직 구현하지 않은 규칙:

- **Unsplash 등 무료 라이선스 사진** — 지금은 사진 없이 그라데이션만 씁니다.
- **렌더링 후 이미지 검수** — 사람이 직접 해야 합니다. 특히 "문장이 원문 그대로
  복사되지 않았는가"는 자동으로 확인할 수 없으니 게시 전에 원문과 대조하세요.

## 카드 템플릿

`src/lib/templates/`에 있습니다. 두 축으로 나눕니다.

- **배경** — `color`(단색·그라데이션)와 `photo`(사진 위 글씨)
- **글꼴** — `sans`(원티드산스)와 `serif`(나눔명조)

사진형은 글자에 테두리나 그늘을 넣는데, 그건 사진이 복잡해서 생긴 장치입니다.
같은 처리를 단색 배경에 쓰면 근거 없이 요란해지므로 섞지 않습니다.

**아직 사진 파이프라인이 없어 `color` 템플릿만 고를 수 있습니다.**
`availableTemplates(hasPhoto)`가 걸러냅니다.

새 디자인을 넣으려면 `src/components/templates/`에 컴포넌트를 만들고
`src/lib/templates/index.ts`의 `TEMPLATES` 배열에 한 줄 추가하면 됩니다.
다른 곳은 건드릴 필요가 없습니다. 배열의 첫 항목이 기본값입니다.

고른 템플릿은 결과와 함께 보관되므로(`CardNewsEntry.templateId`), 다른 결과를
보다가 돌아와도 유지됩니다.

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

카드에 쓰는 [원티드산스](https://github.com/wanteddev/wanted-sans)(고딕)와
[나눔명조](https://hangeul.naver.com/font)(명조)를
`public/fonts/`에 함께 넣어 두었습니다. 둘 다 OFL-1.1이고 라이선스 원문은
`public/fonts/OFL.txt`(원티드산스), `public/fonts/OFL-NanumMyeongjo.txt`에 있습니다.

CDN에서 불러오지 않고 저장소에 두는 이유는 PNG로 내보낼 때입니다. 카드를
이미지로 구우려면 폰트를 파일 안에 심어야 하는데, 다른 출처에서 받은 폰트는
CORS 때문에 글자가 깨질 수 있습니다.

## 주요 파일

| 경로 | 하는 일 |
| --- | --- |
| `src/app/api/generate/route.ts` | 기사 읽기 + Gemini 호출 + 형식 검증/재시도 |
| `src/lib/cardnews.ts` | 카드 규격, 데이터 타입, 모델 응답 정리 |
| `src/components/templates/` | 카드 템플릿별 렌더링 (1080×1350) |
| `src/lib/templates/` | 템플릿 목록과 배경·글꼴 축 정의 |
| `src/lib/exportCards.ts` | 카드 DOM을 PNG/ZIP으로 내보내기 |
| `src/app/preview/page.tsx` | 미리보기 화면과 내보내기 버튼 |
