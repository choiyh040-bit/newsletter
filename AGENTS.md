<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 개발일지를 남긴다

작업 한 마디가 끝나면 `DEVLOG.md` 맨 위에 항목을 이어 적는다. 한 마디는
커밋 하나가 아니라 "하나의 목표가 끝난 지점"이다. 여러 커밋이 한 항목이 될
수도 있다.

무엇을 했는지가 아니라 **왜 그렇게 했는지**를 적는다. 무엇을 했는지는
`git log`에 있다. 나중에 다시 볼 때 아쉬운 쪽은 언제나 판단의 근거다.

항목에 넣을 것:

- **배경** — 무엇이 문제여서 손댔는가
- **결정과 근거** — 선택지가 여럿이었다면 왜 그것을 골랐는가
- **겪은 문제** — 원인과 해결. 특히 원인이 엉뚱한 곳에 있었던 경우
- **남은 일** — 알면서 안 한 것과 그 이유

빠뜨리기 쉬운 것들:

- 하려다 **안 하기로 한 것**과 그 이유. 나중에 같은 고민을 반복하지 않는다.
- 규칙이나 스펙을 **일부러 다르게 구현한 곳**. 예를 들어 SKILL.md는 `<br>`로
  줄을 끊으라고 하지만 여기서는 줄 배열을 쓴다.
- **저장소 밖에 있는 설정** 때문에 생긴 문제. Vercel 대시보드 설정 같은 것은
  코드를 아무리 봐도 원인을 알 수 없다.

# 제작 규칙

카드뉴스 제작 규칙의 원본은 `.claude/skills/mice-cardnews/SKILL.md`이다.
카드 생성이나 렌더링을 건드리기 전에 먼저 읽는다. 각 규칙이 어느 파일에
구현돼 있는지는 README의 대조표에 있다.
