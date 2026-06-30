import { createClient } from "@supabase/supabase-js";

import type { Database, PostType } from "../lib/supabase/types";

type SeedTag = {
  slug: string;
  label: string;
};

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorSlug: string;
  date: string;
  tags: string[];
  featured?: boolean;
  imageUrl?: string;
};

const TAGS: SeedTag[] = [
  { slug: "spec-news", label: "SPEC 소식" },
  { slug: "curriculum", label: "커리큘럼" },
  { slug: "alumni", label: "Alumni" },
  { slug: "mentoring", label: "멘토링" },
  { slug: "demoday", label: "Demo Day" },
  { slug: "vcc", label: "VCC" },
  { slug: "tips", label: "창업 Tips" },
  { slug: "interview", label: "인터뷰" },
  { slug: "startup", label: "Startup" },
];

const BLOG_POSTS: SeedPost[] = [
  {
    slug: "spec-4th-cohort-recruitment",
    title: "SPEC 4기 모집 시작 — 성균관대 최고의 창업 여정이 열립니다",
    excerpt:
      "2026년 봄, SPEC 4기 멤버를 모집합니다. 30주간의 집중 커리큘럼과 실전 창업 경험을 함께할 도전자를 기다립니다.",
    content: `2026년 봄, SPEC이 네 번째 기수의 문을 엽니다. 이번 4기는 지난 3개 기수의 운영 경험을 바탕으로 커리큘럼을 대폭 강화했습니다. Phase 1에서의 팀 셔플, Phase 2의 매출 챌린지, 그리고 Phase 3 데모데이까지 — 각 단계가 실제 창업에 필요한 역량을 단련하도록 설계되었습니다.

지원 자격은 성균관대 재학생 및 휴학생으로, 전공 제한은 없습니다. 개발자, 디자이너, 비즈니스 기획자 모두 환영합니다. 비개발자도 바이브코딩을 통해 MVP를 만들 수 있도록 지원하니, 기술 배경이 없다고 주저하지 마세요.

지원 기간은 2026년 2월 10일부터 3월 7일까지이며, 서류 심사와 인터뷰를 거쳐 최종 40명을 선발합니다. SPEC과 함께 인생에서 가장 치열한 30주를 보낼 준비가 되셨나요? 지금 바로 지원하세요.`,
    author: "이정훈",
    authorSlug: "junghoon-lee",
    date: "2026년 2월",
    tags: ["spec-news", "curriculum"],
    featured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  },
  {
    slug: "3rd-cohort-demoday-recap",
    title: "3기 데모데이: 9팀의 도전과 성과",
    excerpt:
      "SPEC 3기 데모데이가 성료되었습니다. 9개 팀이 30주간의 여정을 마무리하며 투자자와 멘토 앞에서 피칭한 현장을 돌아봅니다.",
    content: `지난 1월 17일, 성균관대 캠퍼스에서 SPEC 3기 데모데이가 열렸습니다. 9개 팀이 각자의 솔루션을 투자자, 교수진, 그리고 업계 멘토 앞에서 발표했습니다. 이번 기수에서는 AI 기반 서비스부터 로컬 커머스 플랫폼까지 다양한 분야의 팀이 참가했습니다.

최우수상은 AI 기반 학습 튜터 '스터디버디'를 개발한 팀이 수상했으며, 청중 투표에서는 반려동물 건강관리 앱 '펫케어'가 1위를 차지했습니다. 총 4개 팀이 후속 투자 미팅을 확정 지었고, 2개 팀은 데모데이 직후 엔젤 투자 유치에 성공했습니다.

SPEC 대표 이정훈은 "매 기수마다 팀들의 완성도와 실행력이 높아지고 있다. 3기의 성과는 SPEC 커리큘럼이 실제 창업으로 이어지는 구조라는 것을 증명한다"고 밝혔습니다.`,
    author: "김수진",
    authorSlug: "sujin-kim",
    date: "2026년 1월",
    tags: ["demoday", "spec-news"],
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  },
  {
    slug: "revenue-challenge-week3",
    title: "매출 챌린지 3주차 — 누적 매출 2,300만원 돌파",
    excerpt:
      "Phase 2 매출 챌린지 3주차 현황 업데이트. 전체 팀 누적 매출이 2,300만원을 돌파하며 역대 최고 기록을 경신하고 있습니다.",
    content: `SPEC 3기 Phase 2 매출 챌린지가 3주차를 맞이했습니다. 전체 9개 팀의 누적 매출이 2,300만원을 돌파하며, 역대 기수 중 가장 빠른 성장세를 보이고 있습니다. 특히 상위 3개 팀은 이미 개별 매출 500만원을 넘겼습니다.

매출 챌린지는 SPEC 커리큘럼의 핵심 구간으로, 팀들이 실제 시장에서 제품을 판매하고 고객을 확보하는 경험을 합니다. "아이디어가 아니라 매출로 증명하라"는 SPEC의 철학이 가장 잘 드러나는 단계입니다. 올해는 B2B SaaS, 이커머스, 교육 플랫폼 등 다양한 비즈니스 모델이 도전 중입니다.

남은 3주간의 챌린지 결과가 데모데이 피칭 순서와 투자자 매칭에 직접적으로 반영되기 때문에, 각 팀의 실행 속도는 더욱 가속화되고 있습니다.`,
    author: "박민서",
    authorSlug: "minseo-park",
    date: "2025년 12월",
    tags: ["curriculum", "spec-news"],
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
  {
    slug: "vcc-mentor-session-kakao",
    title: "VCC 멘토 특강: 카카오모빌리티 그로스 전략",
    excerpt:
      "VCC(Venture Creation Course) 멘토 특강 시리즈 — 카카오모빌리티 PM 출신 강연자가 전하는 초기 스타트업 그로스 전략.",
    content: `SPEC VCC 멘토 특강 시리즈의 네 번째 세션이 지난주 진행되었습니다. 이번 강연자는 카카오모빌리티에서 그로스 PM으로 활동한 최재영 멘토로, '초기 스타트업이 놓치는 그로스의 기본기'라는 주제로 약 90분간 강연과 Q&A를 이어갔습니다.

최 멘토는 "초기 팀이 흔히 저지르는 실수는 '바이럴'에 집착하는 것"이라며, 실제 카카오모빌리티 초기에 사용했던 채널별 CAC 분석 프레임워크와 리텐션 모델을 공유했습니다. 특히 코호트 분석을 통한 핵심 지표 설정 방법은 참가 팀들에게 즉시 적용 가능한 인사이트를 제공했습니다.

SPEC VCC 멘토 특강은 매월 2회 진행되며, 현직 스타트업 리더와 VC 심사역이 번갈아가며 강연합니다. 다음 세션은 배달의민족 초기 멤버 출신의 '프로덕트-마켓 핏 진단법'이 예정되어 있습니다.`,
    author: "Peter Kim",
    authorSlug: "peter-kim",
    date: "2025년 12월",
    tags: ["vcc", "mentoring"],
    imageUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
  },
  {
    slug: "alumni-interview-1st-cohort-kim",
    title: "SPEC Alumni 인터뷰: 1기 김서준의 AI 스타트업 이야기",
    excerpt:
      "SPEC 1기 출신 김서준이 창업 후 시드 투자 유치까지의 여정을 솔직하게 들려줍니다.",
    content: `SPEC 1기를 수료한 김서준은 현재 AI 기반 법률 문서 자동화 스타트업 'LegalMind'를 운영하고 있습니다. SPEC 수료 직후 법학전문대학원 진학 대신 창업을 선택한 그의 이야기는 많은 후배 기수에게 영감을 주고 있습니다.

"SPEC에서 가장 값진 경험은 팀 셔플이었어요. Phase 1에서 3번의 팀 변경을 거치면서, 사람을 빠르게 파악하고 협업하는 능력이 생겼습니다. 지금 공동창업자를 만난 것도 그 과정 덕분이에요." 김서준은 SPEC 수료 6개월 만에 프라이머로부터 시드 투자를 유치했으며, 현재 월 매출 800만원을 달성하고 있습니다.

그는 후배들에게 "SPEC에 있는 동안 최대한 많은 시도를 하라. 실패해도 괜찮은 환경은 SPEC 밖에서는 찾기 어렵다"고 조언했습니다.`,
    author: "윤하은",
    authorSlug: "haeun-yoon",
    date: "2025년 11월",
    tags: ["alumni", "interview"],
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  },
  {
    slug: "vibe-coding-mvp-guide",
    title: "바이브코딩으로 MVP 만들기 — 비개발자 가이드",
    excerpt:
      "코딩 경험이 없어도 AI 도구를 활용해 작동하는 MVP를 만들 수 있습니다. SPEC에서 검증된 바이브코딩 워크플로우를 소개합니다.",
    content: `바이브코딩(Vibe Coding)은 AI 코딩 도구를 활용해 자연어로 소프트웨어를 만드는 접근법입니다. SPEC에서는 비개발자 팀원도 MVP를 직접 만들 수 있도록 바이브코딩 교육을 커리큘럼에 포함시키고 있습니다.

핵심은 3단계입니다. 첫째, 문제 정의와 사용자 시나리오를 명확하게 작성합니다. 둘째, Cursor 또는 Bolt 같은 AI 코딩 도구에 시나리오를 입력해 초기 프로토타입을 생성합니다. 셋째, 반복적으로 피드백을 주며 완성도를 높여갑니다. SPEC 3기에서는 이 방법으로 비개발자 3명이 2주 만에 작동하는 웹앱 MVP를 완성한 사례도 있었습니다.

물론 바이브코딩에도 한계는 있습니다. 복잡한 백엔드 로직이나 결제 연동 같은 부분은 여전히 개발자의 도움이 필요합니다. 하지만 "아이디어 검증" 단계에서 비개발자가 직접 프로토타입을 만들 수 있다는 것은 팀의 실행 속도를 극적으로 높여줍니다.`,
    author: "이정훈",
    authorSlug: "junghoon-lee",
    date: "2025년 11월",
    tags: ["tips", "curriculum"],
    imageUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
  },
  {
    slug: "5-things-before-fundraising",
    title: "투자 유치 전 반드시 알아야 할 5가지",
    excerpt:
      "투자를 받기 전에 확인해야 할 핵심 체크리스트. SPEC 멘토단과 VC 심사역이 함께 정리한 초기 창업자 필독 가이드.",
    content: `SPEC 멘토단과 현직 VC 심사역들이 함께 정리한 '투자 유치 전 반드시 알아야 할 5가지'를 공유합니다. 이 내용은 SPEC VCC 세션에서 가장 많은 질문이 나왔던 주제를 기반으로 구성되었습니다.

첫째, 투자 라운드의 구조를 이해하세요. 시드, 프리-A, 시리즈 A의 차이와 각 단계에서 투자자가 기대하는 지표가 다릅니다. 둘째, 밸류에이션은 협상이지 공식이 아닙니다. 셋째, 텀시트를 받았다고 끝이 아닙니다 — DD(실사) 과정과 주주간계약서를 꼼꼼히 확인하세요. 넷째, 투자금 사용 계획을 구체적으로 세우세요. '마케팅에 사용하겠다'가 아니라 '3개월간 CAC 5만원으로 유저 1만 명 확보'처럼요.

다섯째이자 가장 중요한 것: 투자는 수단이지 목적이 아닙니다. 매출과 성장이 있는 팀에게 투자가 따라옵니다. SPEC에서 매출 챌린지를 먼저 하는 이유이기도 합니다.`,
    author: "Peter Kim",
    authorSlug: "peter-kim",
    date: "2025년 10월",
    tags: ["tips", "vcc"],
  },
  {
    slug: "2nd-cohort-review",
    title: "2기 수료 후기: '인생에서 가장 치열했던 30주'",
    excerpt:
      "SPEC 2기 수료생들의 솔직한 후기. 팀 셔플, 매출 챌린지, 데모데이를 거치며 무엇을 얻었는지 직접 들어봅니다.",
    content: `SPEC 2기를 수료한 4명의 멤버가 30주간의 여정을 돌아봤습니다. "처음 팀 셔플을 당했을 때는 솔직히 화가 났어요. 하지만 3번째 팀에서 만난 팀원들과 지금도 함께 창업하고 있습니다." — 2기 수료생 정다은.

"매출 챌린지 기간이 가장 힘들었지만 가장 많이 배웠어요. 교실에서는 절대 배울 수 없는 것들이었습니다. 고객이 '안 사겠다'고 할 때 어떻게 반응해야 하는지, 가격을 어떻게 책정해야 하는지 — 전부 현장에서 체득했습니다." — 2기 수료생 이현우.

"SPEC 이전의 저는 '좋은 아이디어만 있으면 된다'고 생각했어요. SPEC 이후의 저는 '실행이 전부'라는 걸 압니다. 30주 동안 아이디어는 10번 바뀌었지만, 실행하는 근육은 한 번 생기면 사라지지 않더라고요." — 2기 수료생 한지민. 현재 2기 수료생 중 3팀이 법인을 설립하고 실제 서비스를 운영 중입니다.`,
    author: "김수진",
    authorSlug: "sujin-kim",
    date: "2025년 10월",
    tags: ["alumni", "spec-news"],
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  },
  {
    slug: "spec-rise-vcc-mini-mba",
    title: "SPEC × RISE 사업단, VCC 미니 MBA 공동 운영 발표",
    excerpt:
      "성균관대 RISE 사업단과 SPEC이 손잡고 VCC 기반의 미니 MBA 프로그램을 공동 운영합니다.",
    content: `SPEC과 성균관대 RISE(Regional Innovation System & Education) 사업단이 VCC(Venture Creation Course) 기반 미니 MBA 프로그램을 공동 운영하기로 했습니다. 이번 협력은 대학 창업 교육의 새로운 모델을 제시하겠다는 양측의 목표가 일치한 결과입니다.

미니 MBA 프로그램은 총 8주 과정으로, 비즈니스 모델링, 재무 분석, 마케팅 전략, 팀 빌딩의 4개 모듈로 구성됩니다. SPEC의 실전 중심 커리큘럼과 RISE 사업단의 학술적 프레임워크가 결합되어, 이론과 실습 모두를 아우르는 프로그램이 될 예정입니다.

참가 대상은 성균관대 전 캠퍼스 재학생이며, SPEC 멤버에게는 VCC 크레딧으로 인정됩니다. 프로그램 수료자에게는 RISE 사업단 인증서가 발급되며, 우수 팀에게는 SPEC 정규 기수 우선 선발 혜택이 주어집니다.`,
    author: "이정훈",
    authorSlug: "junghoon-lee",
    date: "2025년 9월",
    tags: ["spec-news", "vcc"],
    imageUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
  },
  {
    slug: "pitch-deck-tips-from-mentors",
    title: "데모데이 피치덱 작성법 — 멘토가 알려주는 팁",
    excerpt:
      "데모데이에서 투자자의 마음을 사로잡는 피치덱, 어떻게 만들어야 할까? SPEC 멘토단이 전하는 실전 작성법.",
    content: `SPEC 데모데이를 앞둔 팀들이 가장 고민하는 것 중 하나가 피치덱입니다. SPEC 멘토단에서 지난 3개 기수의 데모데이 피치를 분석하고, 투자자들의 피드백을 종합해 피치덱 작성 가이드를 정리했습니다.

핵심 원칙은 3가지입니다. 첫째, "문제 → 솔루션 → 시장 → 트랙션 → 팀" 순서를 지키되, 첫 2슬라이드에서 승부하세요. 투자자는 평균 3분 안에 관심 여부를 결정합니다. 둘째, 숫자로 말하세요. "많은 사용자"가 아니라 "MAU 3,200명, 주간 리텐션 42%"처럼 구체적 지표가 설득력을 만듭니다. 셋째, 디자인에 과도하게 투자하지 마세요. 깔끔한 10장이 화려한 30장보다 낫습니다.

가장 흔한 실수는 '기술 설명에 시간을 너무 쓰는 것'입니다. 투자자가 알고 싶은 건 기술이 얼마나 대단한지가 아니라, 그 기술이 고객의 문제를 얼마나 잘 해결하는지입니다.`,
    author: "Peter Kim",
    authorSlug: "peter-kim",
    date: "2025년 9월",
    tags: ["tips", "demoday"],
  },
  {
    slug: "phase1-retrospective-team-shuffle",
    title: "Phase 1 회고: 팀 셔플이 가르쳐준 것들",
    excerpt:
      "SPEC의 독특한 팀 셔플 시스템. 3번의 팀 변경을 거치며 참가자들이 배운 것은 무엇이었을까?",
    content: `SPEC의 Phase 1은 다른 창업 프로그램과 확연히 다른 구조를 가지고 있습니다. 참가자들은 10주 동안 3번의 팀 셔플을 경험합니다. 처음에는 "왜 팀을 바꾸나요?"라는 불만이 나오지만, Phase 1이 끝날 무렵에는 "이 과정이 없었으면 지금의 팀을 못 만났을 것"이라는 감사의 목소리가 나옵니다.

팀 셔플의 목적은 세 가지입니다. 첫째, 다양한 사람과 일해보며 자신의 협업 스타일을 파악합니다. 둘째, 좋은 공동창업자를 데이터 기반으로 선택할 수 있게 됩니다. 셋째, 아이디어에 집착하지 않는 유연함을 기릅니다.

3기 참가자 설문 결과, 92%가 "팀 셔플이 SPEC에서 가장 가치 있는 경험이었다"고 답했으며, 현재 활동 중인 SPEC-backed companies의 68%가 팀 셔플 과정에서 공동창업자를 만났습니다.`,
    author: "김수진",
    authorSlug: "sujin-kim",
    date: "2025년 8월",
    tags: ["curriculum", "spec-news"],
    imageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  },
  {
    slug: "skku-startup-ecosystem-future",
    title: "성균관대 창업 생태계의 미래, SPEC이 만들어갑니다",
    excerpt:
      "성균관대의 창업 환경은 어떻게 변하고 있을까? SPEC이 학생 주도 창업 문화의 중심에서 만들어가고 있는 변화를 소개합니다.",
    content: `성균관대는 국내 대학 중 창업 인프라가 잘 갖춰진 대학으로 꼽히지만, 학생 주도의 체계적인 창업 교육 프로그램은 부족했습니다. SPEC은 이 공백을 메우기 위해 2024년 1기를 시작했고, 지금까지 약 120명의 멤버가 프로그램을 거쳐갔습니다.

SPEC의 차별점은 '학생이 학생을 가르치는' 구조가 아니라, 실전 창업자와 현직 VC가 깊이 관여하는 커리큘럼에 있습니다. 매출 챌린지를 통해 실제 비즈니스를 운영하고, 데모데이를 통해 투자자 앞에 서는 경험은 어떤 창업 동아리에서도 제공하기 어려운 가치입니다.

앞으로 SPEC은 알럼나이 네트워크 강화, 타 대학과의 연합 프로그램, 그리고 글로벌 액셀러레이터와의 파트너십을 통해 성균관대를 한국 대학 창업의 허브로 만들겠다는 비전을 가지고 있습니다.`,
    author: "이정훈",
    authorSlug: "junghoon-lee",
    date: "2025년 8월",
    tags: ["spec-news", "startup"],
  },
  {
    slug: "alumni-network-launch",
    title: "SPEC Alumni Network 공식 출범 — 기수를 넘어 연결됩니다",
    excerpt:
      "1기부터 3기까지, SPEC 수료생들이 하나로 연결되는 Alumni Network가 공식 출범했습니다.",
    content: `SPEC Alumni Network가 공식 출범했습니다. 1기부터 3기까지 약 90명의 수료생이 참여하는 이 네트워크는 기수를 넘어선 협업과 성장을 목표로 합니다. 분기별 네트워킹 이벤트, 투자 정보 공유, 공동 채용 풀, 멘토링 매칭 등 다양한 프로그램이 운영됩니다.

첫 번째 네트워킹 이벤트에서는 1기 수료생이 현재 운영 중인 스타트업의 CTO 포지션을 3기 수료생에게 제안하는 장면이 연출되기도 했습니다. "SPEC에서의 경험을 공유한 사람이라면 일하는 방식과 가치관을 이미 알고 있으니까요." — 1기 알럼나이 김서준.

SPEC Alumni Network는 Slack 워크스페이스와 분기별 오프라인 모임을 중심으로 운영되며, 현역 기수 멤버들도 참관 형태로 참여할 수 있습니다.`,
    author: "윤하은",
    authorSlug: "haeun-yoon",
    date: "2025년 7월",
    tags: ["alumni", "spec-news"],
  },
  {
    slug: "customer-interview-masterclass",
    title: "고객 인터뷰 마스터클래스 — 진짜 인사이트를 얻는 질문법",
    excerpt:
      "고객 인터뷰에서 '좋아요, 쓸게요'라는 대답만 듣고 있나요? 실제로 유용한 인사이트를 이끌어내는 인터뷰 기법을 공유합니다.",
    content: `"이 제품 어떤 것 같아요?"라고 물으면, 대부분의 응답자는 "좋은 것 같아요"라고 답합니다. 이건 데이터가 아니라 예의입니다. SPEC Phase 1에서 팀들이 가장 먼저 배우는 것이 바로 '올바른 고객 인터뷰 방법'입니다.

핵심은 The Mom Test 프레임워크입니다. 상대방이 거짓말할 수 없는 질문을 해야 합니다. "이 서비스를 사용하시겠어요?" 대신 "지금 이 문제를 어떻게 해결하고 계세요?"를 물어보세요. "이 기능이 필요하세요?" 대신 "지난 한 달간 이 문제 때문에 돈을 쓴 적이 있나요?"를 확인하세요.

SPEC 3기에서 이 방법을 도입한 후, 팀들의 피벗 속도가 평균 2주 빨라졌습니다. 잘못된 방향으로 한 달을 달리는 것보다, 첫 주에 방향을 바로잡는 것이 훨씬 효율적이기 때문입니다.`,
    author: "박민서",
    authorSlug: "minseo-park",
    date: "2025년 7월",
    tags: ["tips", "curriculum"],
  },
  {
    slug: "spec-2nd-demoday-highlights",
    title: "2기 데모데이 하이라이트: 투자자 반응과 후속 성과",
    excerpt:
      "SPEC 2기 데모데이의 주요 장면과 이후 팀들의 투자 유치, 사업화 현황을 정리했습니다.",
    content: `SPEC 2기 데모데이는 2025년 6월, 성균관대 유림아트홀에서 개최되었습니다. 총 8개 팀이 참가했으며, 30명 이상의 투자자와 멘토가 심사 및 네트워킹에 참여했습니다. 이번 데모데이의 가장 큰 특징은 전 팀이 실제 매출 데이터를 가지고 피칭했다는 점입니다.

최우수팀으로 선정된 '그린딜리버리'는 친환경 포장재 구독 서비스로, 데모데이 당시 월 매출 450만원, 리텐션 78%의 성과를 보여줬습니다. 데모데이 후 2주 만에 3곳의 VC로부터 투자 제안을 받았으며, 현재 시드 라운드를 진행 중입니다.

2기 전체적으로는 데모데이 이후 3개월 내에 5개 팀이 법인 설립을 완료했고, 총 투자 유치 금액은 약 1.8억원을 기록했습니다.`,
    author: "김수진",
    authorSlug: "sujin-kim",
    date: "2025년 6월",
    tags: ["demoday", "startup"],
    imageUrl:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
  },
  {
    slug: "lean-startup-myths",
    title: "린스타트업의 오해와 진실 — SPEC 현장에서 배운 것들",
    excerpt:
      "'빠르게 실패하라'는 말의 진짜 의미. SPEC 커리큘럼을 통해 체득한 린스타트업 방법론의 현실적 적용법을 정리합니다.",
    content: `린스타트업 방법론은 많은 창업자들이 알고 있지만, 제대로 실천하는 팀은 드뭅니다. "빠르게 실패하라"는 말은 "아무렇게나 해도 된다"가 아니라, "가설을 세우고 최소 비용으로 검증하라"는 뜻입니다. SPEC에서는 이 원칙을 Phase 1부터 체계적으로 훈련합니다.

가장 흔한 오해는 MVP를 '미완성 제품'으로 이해하는 것입니다. MVP는 최소 기능 제품이 아니라 '학습을 위한 최소 실험'입니다. 랜딩페이지 하나로 수요를 검증할 수 있다면, 앱을 만들 필요가 없습니다. SPEC 2기에서 가장 빠르게 PMF를 찾은 팀은 코드 한 줄 없이 구글 폼과 카카오톡 오픈채팅으로 첫 100명의 유저를 모은 팀이었습니다.

또 하나의 오해: 피벗은 실패가 아닙니다. SPEC에서 데모데이에 오른 팀 중 최초 아이디어를 유지한 팀은 전체의 30%도 되지 않습니다. 나머지 70%는 고객 발견 과정에서 더 나은 기회를 찾아 방향을 전환한 팀들입니다.`,
    author: "이정훈",
    authorSlug: "junghoon-lee",
    date: "2025년 5월",
    tags: ["tips", "startup"],
  },
];

// NOTE: This UUID must correspond to an existing admin profile row in `profiles`.
const SYSTEM_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

function inferPostType(tags: string[]): PostType {
  return tags.includes("spec-news") ? "news" : "blog";
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`Seeding ${TAGS.length} tags...`);
  const { error: tagsUpsertError } = await supabase.from("tags").upsert(TAGS, {
    onConflict: "slug",
  });

  if (tagsUpsertError) {
    throw new Error(`Failed to upsert tags: ${tagsUpsertError.message}`);
  }

  const tagSlugs = TAGS.map((tag) => tag.slug);
  const { data: insertedTags, error: tagsSelectError } = await supabase.from("tags").select("id, slug").in("slug", tagSlugs);

  if (tagsSelectError) {
    throw new Error(`Failed to fetch tags after upsert: ${tagsSelectError.message}`);
  }

  const tagIdBySlug = new Map((insertedTags ?? []).map((tag) => [tag.slug, tag.id]));
  console.log(`Loaded ${tagIdBySlug.size} tag IDs.`);

  const postRows: Database["public"]["Tables"]["posts"]["Insert"][] = BLOG_POSTS.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    type: inferPostType(post.tags),
    author_id: SYSTEM_ADMIN_ID,
    featured: Boolean(post.featured),
    image_url: post.imageUrl ?? "",
    published: true,
  }));

  console.log(`Seeding ${postRows.length} posts...`);
  const { error: postsUpsertError } = await supabase.from("posts").upsert(postRows, {
    onConflict: "slug",
  });

  if (postsUpsertError) {
    throw new Error(`Failed to upsert posts: ${postsUpsertError.message}`);
  }

  const postSlugs = BLOG_POSTS.map((post) => post.slug);
  const { data: insertedPosts, error: postsSelectError } = await supabase.from("posts").select("id, slug").in("slug", postSlugs);

  if (postsSelectError) {
    throw new Error(`Failed to fetch posts after upsert: ${postsSelectError.message}`);
  }

  const postIdBySlug = new Map((insertedPosts ?? []).map((post) => [post.slug, post.id]));
  console.log(`Loaded ${postIdBySlug.size} post IDs.`);

  const postTagRows: Database["public"]["Tables"]["post_tags"]["Insert"][] = [];
  for (const post of BLOG_POSTS) {
    const postId = postIdBySlug.get(post.slug);
    if (!postId) {
      throw new Error(`Missing post id for slug: ${post.slug}`);
    }

    for (const tagSlug of post.tags) {
      const tagId = tagIdBySlug.get(tagSlug);
      if (!tagId) {
        throw new Error(`Missing tag id for slug: ${tagSlug}`);
      }

      postTagRows.push({
        post_id: postId,
        tag_id: tagId,
      });
    }
  }

  console.log(`Seeding ${postTagRows.length} post_tags rows...`);
  const { error: postTagsUpsertError } = await supabase.from("post_tags").upsert(postTagRows, {
    onConflict: "post_id,tag_id",
  });

  if (postTagsUpsertError) {
    throw new Error(`Failed to upsert post_tags: ${postTagsUpsertError.message}`);
  }

  console.log("Blog seed completed successfully.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed script error.";
  console.error(`Blog seed failed: ${message}`);
  process.exit(1);
});
