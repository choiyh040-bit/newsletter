import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { keyword, platform, theme, url } = await request.json();

    if (!keyword || !platform) {
      return Response.json(
        { error: "keyword와 platform은 필수 입력값입니다." },
        { status: 400 }
      );
    }

    const resolvedTheme = theme ?? "Modern Minimal";

    let urlContext = "";
    if (url) {
      try {
        const fetchRes = await fetch(url);
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          const $ = cheerio.load(html);
          $("script, style, noscript, iframe").remove();
          urlContext = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);
        }
      } catch (err) {
        console.warn("Failed to fetch URL:", err);
      }
    }

    const isThreads = platform === "threads";

    const prompt = isThreads
      ? `
당신은 SNS 스레드(Threads) 전문 카피라이터이자 팩트체커입니다.
**강력한 지시사항**: 반드시 제공된 "구글 실시간 검색 기능(Google Search tool)"을 즉각적으로 실행하여, 키워드와 관련된 가장 최신(실시간) 기사, 통계, 트렌드를 검색한 후 그 최신 정보를 기반으로 스레드 타래 콘텐츠를 JSON 형식으로 생성해주세요.

- 키워드: ${keyword}
- 플랫폼: Threads (스레드)
${urlContext ? `- 참고 웹페이지 내용:\n${urlContext}\n` : ""}

[매우 중요 규칙]
절대로 가상의 내용(할루시네이션)이나 거짓 정보를 지어내지 마세요.
반드시 검색된 실제 팩트, 최신 기사, 구체적인 수치나 사례에 기반해서만 작성하세요.

스레드 타래 형식 규칙:
- 각 타래 글은 500자 이내
- 첫 번째 타래: 강력한 후킹 문구 + 핵심 요약 (독자가 반드시 읽고 싶게)
- 중간 타래들: 구체적 사실, 수치, 사례 중심
- 마지막 타래: 마무리 + 팔로우/공유 유도
- 이모지 적극 활용 (각 타래 2-4개)
- 줄바꿈으로 가독성 확보

반드시 아래 JSON 구조로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요:

{
  "title": "타래 전체 제목 (30자 이내)",
  "threads": [
    {
      "threadNumber": 1,
      "content": "첫 번째 타래 본문 (후킹 문구 + 핵심 내용, 이모지 포함)",
      "type": "hook"
    },
    {
      "threadNumber": 2,
      "content": "두 번째 타래 본문",
      "type": "body"
    },
    {
      "threadNumber": 3,
      "content": "세 번째 타래 본문",
      "type": "body"
    },
    {
      "threadNumber": 4,
      "content": "네 번째 타래 본문",
      "type": "body"
    },
    {
      "threadNumber": 5,
      "content": "다섯 번째 타래 본문",
      "type": "body"
    },
    {
      "threadNumber": 6,
      "content": "여섯 번째 타래 본문 (마무리 + 팔로우 유도)",
      "type": "cta"
    }
  ],
  "caption": "Threads에 올릴 첫 게시물 캡션 (150자 이내)",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "metrics": {
    "attention": 숫자(75~99 사이 정수),
    "ctr": 숫자(65~95 사이 정수),
    "dwellTime": 숫자(70~99 사이 정수),
    "share": 숫자(55~90 사이 정수),
    "like": 숫자(70~98 사이 정수),
    "repost": 숫자(50~85 사이 정수)
  }
}

중요: 모든 텍스트는 한국어로 작성하세요.
`
      : `
당신은 SNS 카드뉴스 전문 카피라이터이자 팩트체커입니다.
**강력한 지시사항**: 반드시 제공된 "구글 실시간 검색 기능(Google Search tool)"을 즉각적으로 실행하여, 키워드와 관련된 가장 최신(실시간) 기사, 통계, 트렌드를 검색한 후 그 최신 정보를 기반으로 인스타그램 카드뉴스 콘텐츠를 JSON 형식으로 생성해주세요.

- 키워드: ${keyword}
- 플랫폼: Instagram (인스타그램)
- 테마/스타일: ${resolvedTheme}
${urlContext ? `- 참고 웹페이지 내용 (본문 요약용):\n${urlContext}\n` : ""}

[매우 중요 규칙]
절대로 가상의 내용(할루시네이션)이나 거짓 정보를 지어내지 마세요.
반드시 검색된 실제 팩트, 최신 기사, 구체적인 수치나 사례(또는 제공된 참고 웹페이지 내용)에 기반해서만 작성하세요.

반드시 아래 JSON 구조로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요:

{
  "title": "카드뉴스 전체 제목 (30자 이내)",
  "slides": [
    {
      "slideNumber": 1,
      "imageKeyword": "현재 슬라이드 내용과 완벽히 일치하는 고품질 이미지를 생성하기 위한 영어 프롬프트 (예: 'modern office working people, photorealistic, cinematic lighting')",
      "heading": "슬라이드 제목 (20자 이내)",
      "subheading": "부제목 (30자 이내)",
      "body": "본문 내용 (80자 이내, 핵심 메시지)"
    },
    {
      "slideNumber": 2,
      "imageKeyword": "영어 프롬프트",
      "heading": "슬라이드 제목",
      "subheading": "부제목",
      "body": "본문 내용"
    },
    {
      "slideNumber": 3,
      "imageKeyword": "영어 프롬프트",
      "heading": "슬라이드 제목",
      "subheading": "부제목",
      "body": "본문 내용"
    },
    {
      "slideNumber": 4,
      "imageKeyword": "영어 프롬프트",
      "heading": "슬라이드 제목",
      "subheading": "부제목",
      "body": "본문 내용"
    },
    {
      "slideNumber": 5,
      "imageKeyword": "영어 프롬프트",
      "heading": "마무리 CTA",
      "subheading": "행동 유도 문구",
      "body": "팔로우 또는 공유 유도 멘트"
    }
  ],
  "caption": "Instagram에 올릴 게시물 캡션 (150자 이내, 자연스러운 구어체)",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "metrics": {
    "attention": 숫자(75~99 사이 정수),
    "ctr": 숫자(65~95 사이 정수),
    "dwellTime": 숫자(70~99 사이 정수),
    "share": 숫자(55~90 사이 정수),
    "like": 숫자(70~98 사이 정수),
    "repost": 숫자(50~85 사이 정수)
  }
}

중요: 모든 텍스트는 한국어로 작성하고, ${resolvedTheme} 스타일에 맞는 톤앤매너를 유지하세요.
Instagram 플랫폼 특성에 최적화된 콘텐츠를 작성하세요.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text ?? "";

    const jsonStr = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const data = JSON.parse(jsonStr);

    return Response.json(data);
  } catch (error: unknown) {
    console.error("Content generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: "콘텐츠 생성 중 오류가 발생했습니다.", detail: message },
      { status: 500 }
    );
  }
}
