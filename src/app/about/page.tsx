import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { Section } from "@/components/InfoPage";
import { TEMPLATES } from "@/lib/templates";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `서비스 소개 · ${SITE_NAME}`,
  description: "키워드나 기사 주소 하나로 인스타그램 카드뉴스(1080×1350)를 만드는 무료 도구입니다.",
};

export default function AboutPage() {
  return (
    <InfoPage
      title="서비스 소개"
      lead={`${SITE_NAME}는 키워드나 기사 주소 하나로 인스타그램 카드뉴스를 만들어 주는 무료 도구입니다. 전시·컨벤션·관광(MICE) 소식을 빠르게 카드로 옮기려는 홍보 담당자와 뉴스 계정 운영자를 위해 만들었습니다.`}
    >
      <Section title="무엇을 해 주나요">
        <ul>
          <li>
            <strong>자료 모으기</strong> — 키워드를 넣으면 최근 소식을 검색해 모으고, 기사 주소를 넣으면 그 기사
            본문을 읽습니다.
          </li>
          <li>
            <strong>카드 글 쓰기</strong> — 모은 자료를 바탕으로 표지와 본문 5~7장, 인스타그램 캡션과 해시태그를
            씁니다. 원문을 그대로 옮기지 않고 요약해 다시 씁니다.
          </li>
          <li>
            <strong>디자인 입히기</strong> — 고른 템플릿과 색으로 1080×1350(4:5) 카드를 그립니다. 인스타그램 세로
            피드에서 잘리지 않는 크기입니다.
          </li>
          <li>
            <strong>사진 붙이기</strong> — 사진 템플릿을 고르면 장마다 어울리는 사진을 저작권 걱정 없는 무료 사진
            사이트에서 찾아 붙입니다.
          </li>
          <li>
            <strong>내려받기</strong> — 카드 한 장씩 PNG로, 또는 전체를 ZIP 하나로 받습니다.
          </li>
        </ul>
      </Section>

      <Section title="지키는 원칙">
        <ul>
          <li>
            <strong>출처를 밝힙니다.</strong> 참고한 기사 하나를 캡션 끝에 출처로 붙입니다. 소셜 미디어 글은 출처로
            쓰지 않습니다.
          </li>
          <li>
            <strong>쓸 수 있는 사진만 씁니다.</strong> 픽사베이·언스플래쉬처럼 상업적 사용이 허용된 사진, 위키미디어
            공용의 자유 라이선스 사진만 찾습니다. 보도 사진이나 유료 사진은 가져오지 않습니다. 작가 표기가 필요한
            사진은 카드와 캡션에 자동으로 적습니다.
          </li>
          <li>
            <strong>특정 인물이 중심인 사진은 피합니다.</strong> 행사장, 건물, 군중, 사물처럼 초상권 부담이 적은
            사진을 고릅니다.
          </li>
          <li>
            <strong>게시 전 확인은 사람이 합니다.</strong> 글은 AI가 쓰기 때문에 틀릴 수 있습니다. 미리보기에서 글자를
            고칠 수 있으니 숫자와 날짜는 꼭 원문과 맞춰 보세요.
          </li>
        </ul>
      </Section>

      <Section title={`고를 수 있는 디자인 ${TEMPLATES.length}종`}>
        <ul>
          {TEMPLATES.map((t) => (
            <li key={t.id}>
              <strong>{t.name}</strong> — {t.description}
            </li>
          ))}
        </ul>
        <p>대부분의 디자인은 강조색이나 종이색을 고를 수 있고, 원하는 색을 직접 고를 수도 있습니다.</p>
      </Section>

      <Section title="무료로 쓸 수 있나요">
        <p>
          네. 회원가입이나 로그인 없이 바로 쓸 수 있습니다. 만든 결과는 서버가 아니라 쓰는 분의 브라우저에
          저장됩니다. 자세한 내용은 <Link href="/privacy">개인정보처리방침</Link>에 있습니다.
        </p>
        <p>
          처음 쓰신다면 <Link href="/guide">사용법·자주 묻는 질문</Link>부터 보시면 좋습니다.
        </p>
      </Section>
    </InfoPage>
  );
}
