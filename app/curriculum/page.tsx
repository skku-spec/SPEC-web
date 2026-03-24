import { getCurriculumWeeks, getCurriculumAreas } from '@/lib/actions/curriculum';
import CurriculumClient from './client-page';

const FALLBACK_PRENEUR_AREAS = [
  {
    num: '01',
    title: '조직 운영 & 스케일업',
    subtitle: 'Operations & Scale-up',
    description:
      'SPEC을 하나의 스타트업으로 정의하고 시스템 설계를 주도합니다. 운영 체계화와 문화 구축을 통해 조직의 선행 성장을 최우선으로 실현합니다.',
    activities: [
      'SPEC 내부 운영 프로세스 설계 및 최적화',
      '기수별 온보딩/오프보딩 체계 구축',
      '조직 문화 정의 — 행동 강령, 의사결정 구조 수립',
      'OKR 기반 분기별 목표 설정 및 트래킹',
      '운영 매뉴얼 작성 — 후속 기수를 위한 레거시 구축',
    ],
  },
  {
    num: '02',
    title: '투자사 IR & 파트너십',
    subtitle: 'Investor Relations & Partnerships',
    description:
      '전략적 IR과 파트너십 발굴로 핵심 자원을 확보합니다. 자원 유입을 체계화하여 SPEC이 지속 성장하는 비즈니스 구조를 설계합니다.',
    activities: [
      '투자사/기업 대상 SPEC IR 덱 작성 및 피칭',
      '전략적 파트너십 발굴 — 기업, 대학, 정부 기관',
      '후원 유치 전략 수립 및 실행',
      '외부 협업 프로그램 기획 (해커톤, 공동 세션 등)',
      'SPEC 브랜드 가치 제안 정리 및 커뮤니케이션',
    ],
  },
  {
    num: '03',
    title: 'Learner 서포트 & 멘토링',
    subtitle: 'Learner Support & Mentoring',
    description:
      '밀착 코칭으로 러너의 잠재력을 깨우고 성장을 견인합니다. 지표를 정교하게 트래킹하여 러너와 SPEC의 공동 성공을 실현합니다.',
    activities: [
      'Learner 팀 주간 코칭 세션 운영',
      '오피스아워 — 1:1 멘토링 및 문제 해결',
      'Learner 성장 지표 대시보드 관리 및 분석',
      '외부 멘토 네트워크 연결 — 현직 창업가, VC, 전문가',
      '데모데이 준비 서포트 — 피치 리허설, 자료 검토',
    ],
  },
  {
    num: '04',
    title: '커뮤니티 빌딩',
    subtitle: 'Community Building',
    description:
      '알럼나이 네트워크와 외부 행사를 기획하여 SPEC의 영향력을 넓힙니다. 차별화된 브랜드 빌딩으로 창업 생태계에 SPEC의 존재감을 각인시킵니다.',
    activities: [
      '알럼나이 네트워크 활성화 — 월간 동문 모임, 뉴스레터',
      '외부 행사 기획 및 운영 — 밋업, 네트워킹 이벤트',
      'SPEC 브랜드 관리 — SNS, 콘텐츠 전략',
      '타 창업 커뮤니티와의 교류 및 협업',
      '차기 기수 리쿠르팅 전략 수립 및 실행',
    ],
  },
];

const FALLBACK_LEARNER_WEEKS = [
  {
    week: 1,
    topic: 'Kickoff',
    objectives: 'SPEC 철학 / 전원 Edge(자기소개) 발표 / 러너 3기 발표 / 아이스브레이킹',
    assignment: '0원',
    notes: '프로그램 시작',
  },
  {
    week: 2,
    topic: '제로투원 챌린지',
    objectives: '제로투원 챌린지 소개 / 돈 버는 100가지 방법 / 팀 배정 / 슬랙, 노션 교육 / 팀별 브레인스토밍 / 아이디어 발표',
    assignment: '매출 자유·자본금 10만원',
    notes: '',
  },
  {
    week: 3,
    topic: '제로투원 챌린지 (성과 공유) / 비즈니스 케이스 스터디',
    objectives: '제로투원 챌린지 성과 공유 / 프리토타입 / 비즈니스 케이스 스터디 / 창업 이론 학습 / 사업 전략 수립',
    assignment: '매출 자유·자본금 10만원',
    notes: '',
  },
  {
    week: 'OFF',
    topic: '1학기 중간고사 OFF',
    objectives: '시험 기간',
    assignment: '-',
    notes: '',
  },
  {
    week: 4,
    topic: '10만원 챌린지',
    objectives: '10만원 챌린지 / 팀 배정 / 아이디어 발표 / 프리토타입 검증 방법 / 피그마 간단 실습',
    assignment: '매출 10만원·자본금 10만원',
    notes: '',
  },
  {
    week: 5,
    topic: '10만원 챌린지 (중간) / 데이터 분석 교육',
    objectives: '10만원 챌린지 / 데이터 분석 교육',
    assignment: '매출 10만원·자본금 10만원',
    notes: '',
  },
  {
    week: 6,
    topic: '10만원 챌린지 (성과 공유) / 30만원 챌린지',
    objectives: '10만원 챌린지 성과 공유 / 30만원 챌린지 / 아이디어 발표',
    assignment: '매출 10만원·자본금 10만원\n매출 30만원·자본금 10만원',
    notes: '',
  },
  {
    week: 7,
    topic: '30만원 챌린지 (중간) / 비즈니스 설계',
    objectives: '30만원 챌린지 / 비즈니스 이해 / 기회 발굴 / 비즈니스 모델 설계',
    assignment: '-',
    notes: '',
  },
  {
    week: 8,
    topic: '30만원 챌린지 (성과 공유) / 인터뷰, 가설 검증 설계',
    objectives: '30만원 챌린지 성과 공유 / 가설 수립 / 인터뷰 / 검증 실험 설계',
    assignment: '-',
    notes: '',
  },
  {
    week: 9,
    topic: '인터뷰 결과 공유',
    objectives: '인터뷰 결과 공유',
    assignment: '-',
    notes: '',
  },
  {
    week: 10,
    topic: 'BOOTCAMP 졸업 & IR 특강',
    objectives: 'BOOTCAMP 졸업 / STARTUP 페이즈 소개 / 아이디어톤 안내 / IR 특강',
    assignment: '-',
    notes: 'BOOTCAMP 졸업',
  },
  {
    week: 'EVENT',
    topic: '아이디어톤',
    objectives: '1박2일 / 아이디어 피칭 + 팀 스피드 데이팅 + 팀 확정 + 48시간 프로젝트',
    assignment: '-',
    notes: '팀 확정',
  },
  {
    week: 'OFF',
    topic: '1학기 기말고사 OFF',
    objectives: '시험 기간',
    assignment: '-',
    notes: '',
  },
  {
    week: 11,
    topic: 'MVP 빌드 전 구체화',
    objectives: 'MVP 정의 / 스프린트 방법론 / DB 설계 기초 / 기능 명세서 / WBS / IA / 화면 설계서 / Jira / Figjam',
    assignment: '-',
    notes: 'MVP 해커톤',
  },
  {
    week: 'EVENT',
    topic: 'MVP 해커톤',
    objectives: 'MVP 완성 스프린트 (1박2일) / 바이브 코딩 교육',
    assignment: '-',
    notes: 'MVP 해커톤',
  },
  {
    week: 12,
    topic: 'MVP 개발 스프린트',
    objectives: '빠른 이터레이션 / API 연동 / 유저 피드백 수집',
    assignment: '-',
    notes: '',
  },
  {
    week: 13,
    topic: '런칭',
    objectives: '런칭의 기술 (온/오프라인/하이브리드) / 배포 및 모니터링',
    assignment: '만원',
    notes: '',
  },
  {
    week: 14,
    topic: '그로스 해킹과 유닛 이코노믹스',
    objectives: '그로스 해킹 / 유닛 이코노믹스 / 획득 비용 (CAC) / 생애 가치 (LTV) / AARRR 퍼널 분석',
    assignment: '만원',
    notes: '연합 활동',
  },
  {
    week: 15,
    topic: '데이터 기반 의사결정 (리텐션)',
    objectives: '데이터 기반 의사결정 / 리텐션 차트 분석 / 이탈 지점 파악 / 코호트 분석 기법',
    assignment: '만원',
    notes: '',
  },
  {
    week: 16,
    topic: '피봇팅(Pivoting)의 기술',
    objectives: '피보팅 기술 / 가설 실패를 인정하는 법 / 핵심 가치만 남기고 깎아내기',
    assignment: '만원',
    notes: '',
  },
  {
    week: 'EVENT',
    topic: 'Demo Eve 밤샘',
    objectives: '중간 데모데이 전야제 / 피칭 리허설 / 외부 심사위원 피칭',
    assignment: '-',
    notes: '중간 데모데이 & 서울대 창업동아리와 합동 데모데이',
  },
  {
    week: 17,
    topic: '유료 마케팅과 콘텐츠 전략',
    objectives: '유로 마케팅 / 콘텐츠 전략 / Meta/Google 광고 기초 / 고효율 소재 제작 / AB 테스트',
    assignment: '3만원',
    notes: 'Demo Eve 밤샘 (8/13)',
  },
  {
    week: 18,
    topic: '바이럴 루프와 커뮤니티 빌딩',
    objectives: '바이럴 루프 / 커뮤니티 빌딩 / 유저가 유저를 불러오는 장치 설계 / 초기 팬덤 형성 전략',
    assignment: '3만원',
    notes: '',
  },
  {
    week: 19,
    topic: '운영 자동화와 No-Code 확장',
    objectives: '운영 자동화 / No-Code 확장 / 반복적인 CS / 운영 업무 자동화(Zapier, Make 활용)',
    assignment: '3만원',
    notes: '',
  },
  {
    week: 20,
    topic: '중간 점검 : Death Valley 생존 보고',
    objectives: '지표가 안 나오는 이유 처절하게 분석하기 (Self-Roasting)',
    assignment: '3만원',
    notes: '연합 활동',
  },
  {
    week: 21,
    topic: 'B2B 영업 및 제휴 전략',
    objectives: '스케일링이란? / 병목 지점 찾기 / 자동화 심화',
    assignment: '10만원',
    notes: '',
  },
  {
    week: 22,
    topic: '수익모델 구체화',
    objectives: '구독 서비스 vs 건당 결제 / 가격 심리학과 수익 극대화 / 수익모델 구체화',
    assignment: '10만원',
    notes: '',
  },
  {
    week: 23,
    topic: '고객 경험(CX)과 브랜드 보이스',
    objectives: '고객 경험(CX) / 브랜드 보이스',
    assignment: '10만원',
    notes: '연합 활동',
  },
  {
    week: 24,
    topic: '법률 및 세무 기초',
    objectives: '법인 설립 / 주주간 계약서 / 저작권 / 개인정보보호법',
    assignment: '10만원',
    notes: '',
  },
  {
    week: 'OFF',
    topic: '2학기 중간고사 OFF',
    objectives: '시험 기간',
    assignment: '-',
    notes: '',
  },
  {
    week: 25,
    topic: 'Product-Market Fit (PMF) 검증',
    objectives: 'Sean Ellis 테스트 / 재구매율, 재방문율 기반 PMF 판단',
    assignment: '30만원',
    notes: '연합 활동',
  },
  {
    week: 26,
    topic: '조직 관리와 채용',
    objectives: '초기 팀 빌딩 전략 / 컬처 핏(Culture Fit) 정의 / 면접',
    assignment: '30만원',
    notes: '',
  },
  {
    week: 27,
    topic: '최종 데모데이 리허설',
    objectives: '5분 피칭 / 3분 Q&A 대응 전략 / 시각 자료 시인성 개선',
    assignment: '30만원',
    notes: 'Final 해커톤 (11/7-8)',
  },
  {
    week: 'EVENT',
    topic: 'Final 해커톤',
    objectives: '최종 데모데이 준비 (1박2일) / 피칭 리허설',
    assignment: '-',
    notes: 'Final 해커톤',
  },
  {
    week: 28,
    topic: '최종 데모데이',
    objectives: '최종 리허설 / Q&A 마지막 준비 / 데모데이 당일 흐름',
    assignment: '100만원',
    notes: '최종 데모데이 & 연고대 창업동아리와 합동 진행',
  },
  {
    week: 29,
    topic: '회고 + 네트워킹',
    objectives: 'SPEC 4기 전체 회고 / 다음 단계 안내 / 알럼나이 네트워크',
    assignment: '100만원',
    notes: '',
  },
  {
    week: 30,
    topic: 'After SPEC',
    objectives: '스타트업 다음 단계 / 알럼나이 혜택 / 수료식',
    assignment: '지속',
    notes: '프로그램 종료',
  },
];

export default async function CurriculumPage() {
  const [weeksResult, areasResult] = await Promise.all([
    getCurriculumWeeks('learner'),
    getCurriculumAreas('preneur'),
  ]);

  const dbWeeks = weeksResult.data ?? [];
  const dbAreas = areasResult.data ?? [];
  const hasDbCurriculum = dbWeeks.length > 0 || dbAreas.length > 0;

  const displayWeeks = hasDbCurriculum ? dbWeeks : FALLBACK_LEARNER_WEEKS;
  const displayAreas = hasDbCurriculum ? dbAreas : FALLBACK_PRENEUR_AREAS;

  return <CurriculumClient initialWeeks={displayWeeks} initialAreas={displayAreas} />;
}
