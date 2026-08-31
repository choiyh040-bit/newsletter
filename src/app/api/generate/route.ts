import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import {
  extractJson,
  normalizeCardNews,
  type CardNews,
} from "@/lib/cardnews";

/**
 * 검색과 생성을 한 번에 하므로 기본 제한(보통 10초)으로는 자주 잘린다.
 * Vercel 서버리스 함수 상한에 맞춰 60초로 올린다.
 */
export const maxDuration = 60;

const MODEL = "gemini-2.5-flash";

/** 기사 본문을 읽어올 때 기다릴 시간. 이보다 오래 걸리면 검색으로만 만든다. */
const ARTICLE_FETCH_TIMEOUT_MS = 10_000;
const ARTICLE_MAX_CHARS = 6_000;

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  return new GoogleGenAI({ apiKey });
}

/** 기사 URL에서 사람이 읽는 본문만 뽑아낸다. 실패하면 빈 문자열. */
async function readArticle(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ARTICLE_FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CardGenAI/1.0)" },
    });
    if (!res.ok) return "";

    const $ = cheerio.load(await res.text());
    $("script, style, noscript, iframe, nav, header, footer, aside").remove();

    // 기사 본문이 들어가는 흔한 컨테이너를 먼저 찾고, 없으면 body 전체를 쓴다.
    const article = $("article").text() || $("#articleBody").text() || $("body").text();
    return article.replace(/\s+/g, " ").trim().slice(0, ARTICLE_MAX_CHARS);
  } catch {
    return "";
  }
}

function buildPrompt(keyword: string, article: string): string {
  return `당신은 인스타그램 카드뉴스를 만드는 한국어 에디터입니다.
아래 규칙을 지켜 카드뉴스 한 세트를 JSON으로 만들어 주세요.

[소재]
- 키워드: ${keyword}
${
  article
    ? `- 아래 기사 본문을 1차 근거로 삼으세요. 검색은 보조 확인용으로만 쓰세요.\n\n<기사 본문>\n${article}\n</기사 본문>`
    : `- 제공된 기사 본문이 없습니다. 반드시 Google 검색 도구를 실행해 최신 기사와 수치를 확인한 뒤 작성하세요.`
}

[사실 규칙]
- 확인되지 않은 내용을 지어내지 마세요. 검색이나 기사에서 확인한 사실만 쓰세요.
- 수치가 확실하지 않으면 아예 쓰지 마세요. 대략적인 표현으로 얼버무리지 마세요.

[문장 규칙]
- 기사 문장을 그대로 옮기지 말고 반드시 새 문장으로 다시 쓰세요.
- 직접인용은 15단어 미만으로, 세트 전체에서 최대 한 번만 쓰세요.
- 관계자 발언은 따옴표로 인용하지 말고 "~라고 밝혔다" 같은 요약체로 처리하세요.

[구성]
- 슬라이드는 4장 또는 5장. 첫 장은 표지, 마지막 장은 마무리, 나머지는 상세입니다.
- 표지(cover): sub에 짧은 소제목 한 줄, heading에 큰 헤드라인. body는 비우거나 한 줄만.
- 상세(detail): heading은 그 장의 핵심 한 문장, body에 구체적인 사실과 수치.
- 마무리(outro): 내용을 한 줄로 정리하고 저장이나 공유를 자연스럽게 권합니다.

[줄바꿈 규칙 — 매우 중요]
- heading과 body는 문자열이 아니라 "문자열 배열"입니다. 배열의 한 원소가 화면의 한 줄이 됩니다.
- 자동 줄바꿈에 맡기지 말고, 의미가 끊기지 않는 지점에서 직접 나누세요.
- "~습니다", "~했다", "~이다" 같은 서술어가 앞줄과 떨어져 혼자 남지 않게 하세요.
- 한 줄 글자 수 상한: 표지 heading 10자, 상세 heading 13자, body 20자.
- 줄 수 상한: 표지 heading 3줄, 상세 heading 2줄, body 4줄(표지는 2줄).

[디자인]
- accent는 주제 분위기에 맞는 어두운 계열 포인트 컬러 하나를 "#rrggbb" 형식으로 고르세요.
  이 색 하나로 세트 전체 배경 그라데이션을 만들기 때문에, 흰 글씨가 또렷하게 보일 만큼 충분히 어두워야 합니다.
- badge는 모든 슬라이드에 같은 값을 쓰고, 8자 이내의 분류 문구로 하세요.

아래 구조의 순수 JSON만 출력하세요. 설명 문장이나 코드블록을 붙이지 마세요.

{
  "title": "카드뉴스 제목 (30자 이내, 내부 관리용)",
  "accent": "#1a3a5c",
  "slides": [
    {
      "kind": "cover",
      "badge": "MICE 뉴스",
      "sub": "표지 위쪽 작은 소제목",
      "heading": ["표지 헤드라인 첫 줄", "둘째 줄"],
      "body": []
    },
    {
      "kind": "detail",
      "badge": "MICE 뉴스",
      "sub": "",
      "heading": ["상세 헤드라인"],
      "body": ["본문 첫 줄", "본문 둘째 줄"]
    }
  ],
  "caption": "인스타그램 캡션 3~5줄. 줄바꿈은 \\n 으로 표기 (200자 이내)",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "source": { "name": "출처 매체명", "url": "기사 URL 또는 빈 문자열" }
}

모든 텍스트는 한국어로 작성하세요.`;
}

async function generateOnce(prompt: string): Promise<CardNews> {
  const response = await client().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  return normalizeCardNews(extractJson(response.text ?? ""));
}

export async function POST(request: Request) {
  let keyword: string;
  let url: string;

  try {
    const body = await request.json();
    keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    url = typeof body.url === "string" ? body.url.trim() : "";
  } catch {
    return Response.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  if (!keyword && !url) {
    return Response.json(
      { error: "키워드나 기사 URL 중 하나는 입력해야 합니다." },
      { status: 400 }
    );
  }

  const article = url ? await readArticle(url) : "";
  if (url && !article) {
    console.warn("기사 본문을 읽지 못해 검색만으로 생성합니다:", url);
  }

  const prompt = buildPrompt(keyword || "입력된 기사 내용 요약", article);

  // 검색 도구를 켜면 응답 스키마를 강제할 수 없어 형식이 틀어질 때가 있다.
  // 형식 문제로만 한 번 더 시도하고, 그래도 실패하면 오류로 돌려준다.
  try {
    return Response.json(await generateOnce(prompt));
  } catch (firstError) {
    console.warn("첫 생성 실패, 재시도합니다:", firstError);
    try {
      const stricter = `${prompt}\n\n[재시도 안내]\n직전 응답이 형식에 맞지 않았습니다. 여는 중괄호로 시작해 닫는 중괄호로 끝나는 JSON 하나만, 다른 글자 없이 출력하세요.`;
      return Response.json(await generateOnce(stricter));
    } catch (error) {
      console.error("카드뉴스 생성 실패:", error);
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return Response.json(
        { error: "카드뉴스 생성에 실패했습니다.", detail: message },
        { status: 500 }
      );
    }
  }
}
