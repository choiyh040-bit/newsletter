import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { Section } from "@/components/InfoPage";
import { CONTACT_EMAIL, POLICY_DATE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `이용약관 · ${SITE_NAME}`,
  description: `${SITE_NAME} 이용 조건을 안내합니다.`,
};

export default function TermsPage() {
  return (
    <InfoPage
      title="이용약관"
      lead={`${SITE_NAME}(이하 "서비스")를 쓰시면 아래 내용에 동의하신 것으로 봅니다.`}
    >
      <Section title="1. 서비스 내용">
        <p>
          서비스는 키워드나 기사 주소를 받아 인스타그램용 카드뉴스 이미지와 캡션을 만들어 주는 무료 도구입니다.
          회원가입 없이 쓸 수 있습니다.
        </p>
      </Section>

      <Section title="2. 만든 결과물">
        <ul>
          <li>
            글은 AI가 씁니다. <strong>사실과 다르거나 빠진 내용이 있을 수 있습니다.</strong> 게시하기 전에 숫자, 날짜,
            이름을 원문과 맞춰 보는 것은 이용자의 몫입니다.
          </li>
          <li>만든 카드와 캡션은 이용자가 자유롭게 고치고 게시할 수 있습니다.</li>
          <li>
            서비스는 원문을 그대로 옮기지 않고 요약해 다시 쓰며, 참고한 기사를 출처로 붙입니다. 게시할 때 출처 표기를
            지워 생기는 문제는 이용자에게 책임이 있습니다.
          </li>
        </ul>
      </Section>

      <Section title="3. 사진">
        <ul>
          <li>
            서비스가 찾아 붙이는 사진은 상업적 사용이 허용된 무료 사진 사이트(픽사베이, 언스플래쉬)와 위키미디어
            공용의 자유 라이선스 사진입니다. 카드와 캡션에 들어가는 작가·라이선스 표기는 지우지 말아 주세요. 일부
            라이선스는 표기를 조건으로 사용을 허락합니다.
          </li>
          <li>
            ‘내 사진 올리기’로 넣은 사진의 사용 권한은 올린 분이 확인해야 합니다. 서비스는 그 사진을 서버로 받지 않고
            확인하지도 않습니다.
          </li>
          <li>사진 속 인물·상표·건물 등의 권리는 게시하기 전에 이용자가 확인해 주세요.</li>
        </ul>
      </Section>

      <Section title="4. 하지 말아야 할 것">
        <ul>
          <li>자동화 프로그램으로 대량으로 요청해 서비스 운영을 방해하는 일</li>
          <li>남의 명예를 훼손하거나, 법에 어긋나거나, 사실이 아닌 내용을 퍼뜨리는 데 쓰는 일</li>
          <li>남의 저작물을 권리 없이 올려 카드로 만드는 일</li>
        </ul>
      </Section>

      <Section title="5. 서비스의 변경과 중단">
        <p>
          서비스는 무료로 제공되며, 기능이나 디자인은 예고 없이 바뀔 수 있습니다. AI나 사진 사이트 같은 외부 서비스
          사정으로 일시적으로 쓸 수 없거나, 운영상 필요하면 서비스를 멈출 수 있습니다.
        </p>
        <p>만든 결과는 이용자의 브라우저에만 저장되므로, 필요한 결과는 내려받아 따로 보관해 주세요.</p>
      </Section>

      <Section title="6. 책임의 한계">
        <p>
          서비스는 결과물의 정확성이나 특정 목적에 맞는지를 보증하지 않습니다. 법이 허용하는 범위에서, 이용자가
          결과물을 게시하거나 써서 생긴 손해에 대해 책임지지 않습니다.
        </p>
      </Section>

      <Section title="7. 개인정보와 문의">
        <p>
          서비스가 다루는 정보는 <Link href="/privacy">개인정보처리방침</Link>에 있습니다.
          {CONTACT_EMAIL ? (
            <>
              {" "}
              문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 보내 주세요.
            </>
          ) : (
            " 문의처는 준비 중입니다."
          )}
        </p>
        <p>시행일: {POLICY_DATE}</p>
      </Section>
    </InfoPage>
  );
}
