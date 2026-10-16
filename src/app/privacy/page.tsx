import type { Metadata } from "next";
import InfoPage, { Section } from "@/components/InfoPage";
import { ADSENSE_CLIENT, CONTACT_EMAIL, POLICY_DATE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `개인정보처리방침 · ${SITE_NAME}`,
  description: `${SITE_NAME}가 다루는 정보와 그 처리 방법을 안내합니다.`,
};

/**
 * 개인정보처리방침. **사이트가 실제로 하는 일만** 적는다(2026-10-16 코드 기준).
 *
 * - 회원가입·로그인 없음. 이름·연락처를 받지 않는다.
 * - 입력한 키워드·기사 주소는 생성에만 쓰고 서버에 저장하지 않는다(오류 확인용
 *   운영 기록에 기사 주소·사진 검색어가 남을 수 있다 — `console.warn` 등).
 * - 결과·디자인 선택·올린 사진은 브라우저 localStorage 에만 있다.
 * - 사진 사이트에는 서버가 대신 묻는다(`/api/photo` 경유). 이용자 IP 가 가지 않는다.
 * - 브라우저가 직접 부르는 외부: Google Fonts, jsDelivr(글꼴 하나).
 * - 방문 통계: Vercel Web Analytics. 쿠키 없음, 주소의 `?` 뒤(키워드 등)는 잘라 보낸다(`SiteAnalytics`).
 * - 피드백 게시판 글은 GitHub 이슈로 공개 저장. IP 는 연속 글쓰기 막기용 해시로 10분만 메모리에.
 *
 * 광고 항목은 애드센스 번호(`ADSENSE_CLIENT`)가 있을 때만 나온다. 코드를 바꿔
 * 다루는 정보가 달라지면 이 페이지와 `POLICY_DATE` 를 함께 고친다.
 */
export default function PrivacyPage() {
  const ads = Boolean(ADSENSE_CLIENT);
  return (
    <InfoPage
      title="개인정보처리방침"
      lead={`${SITE_NAME}(이하 "서비스")는 이용자의 정보를 꼭 필요한 만큼만 다룹니다. 서비스는 회원가입과 로그인이 없고, 이름·연락처 같은 개인정보를 직접 받지 않습니다.`}
    >
      <Section title="1. 다루는 정보와 쓰는 곳">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>정보</th>
                <th>쓰는 곳</th>
                <th>보관</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>입력한 키워드 또는 기사 주소</td>
                <td>카드뉴스 글을 만들기 위해 서버가 받아 AI(Google Gemini)에 보냅니다. 기사 주소를 넣으면 서버가 그 기사 본문을 읽어 옵니다.</td>
                <td>서버에 저장하지 않습니다.</td>
              </tr>
              <tr>
                <td>만든 결과, 고른 디자인, 직접 올린 사진</td>
                <td>미리보기와 다시 보기에 씁니다.</td>
                <td>
                  <strong>이용자의 브라우저에만</strong> 저장됩니다(localStorage). 서버로 보내지 않습니다.
                </td>
              </tr>
              <tr>
                <td>사진 검색어(영어 낱말)</td>
                <td>사진 템플릿에 쓸 사진을 찾기 위해 서버가 사진 사이트에 보냅니다.</td>
                <td>서버에 저장하지 않습니다.</td>
              </tr>
              <tr>
                <td>피드백 게시판에 쓴 별명과 글</td>
                <td>게시판에 <strong>모두에게 공개</strong>됩니다. GitHub(저장소의 이슈)에 저장되며 GitHub에서도 보입니다.</td>
                <td>운영자가 지우기 전까지 보관합니다. 지우고 싶으면 문의해 주세요.</td>
              </tr>
              <tr>
                <td>게시판에 글을 쓸 때의 IP 주소</td>
                <td>짧은 시간에 글을 여러 번 올리는 것을 막는 데만 씁니다.</td>
                <td>주소를 그대로 두지 않고 바꾼 값(해시)으로, 서버 메모리에 10분만 둡니다.</td>
              </tr>
              <tr>
                <td>접속 기록(IP 주소, 브라우저 종류, 접속 시각 등)</td>
                <td>서비스를 운영하는 호스팅 업체(Vercel)의 서버에 자동으로 남습니다. 오류 확인과 부정 이용 방지에 씁니다.</td>
                <td>호스팅 업체가 정한 기간 동안 보관된 뒤 지워집니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          오류를 확인하기 위한 운영 기록에 입력한 기사 주소나 사진 검색어가 함께 남을 수 있습니다. 이 기록도 호스팅
          업체가 정한 기간이 지나면 지워집니다.
        </p>
      </Section>

      <Section title="2. 외부 서비스">
        <p>서비스는 아래 외부 서비스를 씁니다. 대부분 국외에 있는 업체입니다.</p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>업체</th>
                <th>하는 일</th>
                <th>전달되는 것</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google (Gemini API, 미국)</td>
                <td>자료 검색, 카드 글 쓰기</td>
                <td>키워드, 기사 본문</td>
              </tr>
              <tr>
                <td>Vercel (미국)</td>
                <td>사이트 호스팅, 방문 통계</td>
                <td>접속 기록. 방문 통계는 쿠키 없이 페이지별 방문 수만 셉니다(입력한 키워드·주소는 보내지 않습니다).</td>
              </tr>
              <tr>
                <td>Pixabay (독일), Unsplash (캐나다), Wikimedia Commons (미국)</td>
                <td>사진 검색과 사진 받기</td>
                <td>사진 검색어. 서버가 대신 요청하므로 이용자의 IP 주소는 전달되지 않습니다.</td>
              </tr>
              <tr>
                <td>GitHub (미국)</td>
                <td>피드백 게시판 글 저장</td>
                <td>별명, 글 내용, 분류</td>
              </tr>
              <tr>
                <td>Google Fonts, jsDelivr</td>
                <td>화면 글꼴과 아이콘</td>
                <td>브라우저가 글꼴을 받을 때 IP 주소 등 일반적인 접속 정보</td>
              </tr>
              {ads && (
                <tr>
                  <td>Google AdSense (미국)</td>
                  <td>광고 게재</td>
                  <td>쿠키, 접속 정보 (아래 3항)</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="3. 쿠키와 광고">
        {ads ? (
          <>
            <p>
              서비스는 Google AdSense 광고를 싣습니다. Google과 그 협력사는 쿠키를 써서 이용자가 이 사이트와 다른
              사이트를 방문한 기록을 바탕으로 광고를 보여 줄 수 있습니다.
            </p>
            <ul>
              <li>
                맞춤 광고는{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
                  Google 광고 설정
                </a>
                에서 끌 수 있습니다.
              </li>
              <li>
                Google이 광고 쿠키를 쓰는 방법은{" "}
                <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
                  Google 광고 정책
                </a>
                에 있습니다.
              </li>
              <li>브라우저 설정에서 쿠키를 막거나 지울 수 있습니다. 막아도 카드뉴스 만들기는 그대로 쓸 수 있습니다.</li>
            </ul>
          </>
        ) : (
          <p>서비스는 지금 쿠키를 쓰지 않고, 광고도 싣지 않습니다. 광고를 싣게 되면 이 항목에 미리 알립니다.</p>
        )}
      </Section>

      <Section title="4. 브라우저에 저장된 정보 지우기">
        <ul>
          <li>미리보기의 ‘최근 생성’ 목록에서 결과를 하나씩 지울 수 있습니다.</li>
          <li>브라우저 설정에서 이 사이트의 데이터를 지우면 저장된 결과와 올린 사진이 모두 지워집니다.</li>
        </ul>
      </Section>

      <Section title="5. 만 14세 미만 아동">
        <p>서비스는 아동의 개인정보를 따로 받지 않습니다.</p>
      </Section>

      <Section title="6. 문의">
        {CONTACT_EMAIL ? (
          <p>
            개인정보와 관련한 문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 보내 주세요.
          </p>
        ) : (
          <p>문의처는 준비 중입니다.</p>
        )}
      </Section>

      <Section title="7. 바뀌는 경우">
        <p>이 방침을 바꾸면 이 페이지에 바뀐 내용과 시행일을 알립니다.</p>
        <p>시행일: {POLICY_DATE}</p>
      </Section>
    </InfoPage>
  );
}
