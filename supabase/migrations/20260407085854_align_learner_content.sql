-- Align all 37 learner curriculum rows with authoritative CSV
-- Source: .sisyphus/data/learner-curriculum.csv
-- Mapping: week_label=이름, topic=전체세션_내용, objectives=마일스톤,
--          assignment=챌린지_KPI, notes=바이브 코딩 과제, dates from 날짜

BEGIN;

-- sort_order 1: W1 - Kickoff
UPDATE curriculum_weeks SET
  week_label = 'W1 - Kickoff',
  topic = 'SPEC 철학 / SPEC 소개 / 프러너 4기 발표 / 전원 Edge(자기소개) 발표 / 아이스브레이킹',
  objectives = '프로그램 시작',
  assignment = '0원',
  notes = '테토 에겐 테스트',
  start_date = '2026-03-27',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 1;

-- sort_order 2: W2 - 제로투원 챌린지
UPDATE curriculum_weeks SET
  week_label = 'W2 - 제로투원 챌린지',
  topic = '제로투원 챌린지 소개 / 돈 버는 100가지 방법 / 팀별 브레인스토밍 / 아이디어 발표',
  objectives = '',
  assignment = E'매출 자유 (팀)\n자본금 10만원',
  notes = '장애물 피하기 아케이드 게임',
  start_date = '2026-04-03',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 2;

-- sort_order 3: W3 - 제로투원 챌린지 (끝) / 비즈니스 케이스 스터디(멘토)
UPDATE curriculum_weeks SET
  week_label = 'W3 - 제로투원 챌린지 (끝) / 비즈니스 케이스 스터디(멘토)',
  topic = '제로투원 챌린지 (끝) / 비즈니스 케이스 스터디',
  objectives = '',
  assignment = E'매출 자유 (팀)\n자본금 10만원',
  notes = '음성인식 아케이드 게임',
  start_date = '2026-04-10',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 3;

-- sort_order 4: ⏸️ 1학기 중간고사 OFF
UPDATE curriculum_weeks SET
  week_label = '⏸️ 1학기 중간고사 OFF',
  topic = '시험 기간',
  objectives = '',
  assignment = '-',
  notes = '',
  start_date = '2026-04-13',
  end_date = '2026-04-24'
WHERE track = 'learner' AND sort_order = 4;

-- sort_order 5: W4 - 10만원 챌린지 (시작)
UPDATE curriculum_weeks SET
  week_label = 'W4 - 10만원 챌린지 (시작)',
  topic = '10만원 챌린지 / 팀별 아이디어 발표 / 프리토타입 검증 방법 / 제로투원 챌린지 (성과 공유)',
  objectives = '',
  assignment = E'매출 10만원 (팀)\n자본금 10만원',
  notes = '식단관리 서비스',
  start_date = '2026-05-01',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 5;

-- sort_order 6: W5 - 10만원 챌린지 (중간) / 데이터 분석 교육
UPDATE curriculum_weeks SET
  week_label = 'W5 - 10만원 챌린지 (중간) / 데이터 분석 교육',
  topic = '10만원 챌린지 / 데이터 분석 교육',
  objectives = '',
  assignment = E'매출 10만원 (팀)\n자본금 10만원',
  notes = 'AI 연봉 예측 서비스',
  start_date = '2026-05-08',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 6;

-- sort_order 7: W6 - 10만원 챌린지 (성과 공유) /30만원 챌린지 (시작)
UPDATE curriculum_weeks SET
  week_label = 'W6 - 10만원 챌린지 (성과 공유) /30만원 챌린지 (시작)',
  topic = '10만원 챌린지 성과 공유 / 30만원 챌린지 / 아이디어 발표',
  objectives = '',
  assignment = E'매출 10만원 (팀)\n자본금 10만원\n\n매출 30만원 (팀)\n자본금 10만원',
  notes = 'AI 꿈 해몽 서비스',
  start_date = '2026-05-15',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 7;

-- sort_order 8: W7 - 30만원 챌린지 (중간) / 멘토님 피드백
UPDATE curriculum_weeks SET
  week_label = 'W7 - 30만원 챌린지 (중간) / 멘토님 피드백',
  topic = '30만원 챌린지 / 비즈니스 설계',
  objectives = '',
  assignment = '-',
  notes = '블로그 이웃, 댓글 자동 보내기 서비스',
  start_date = '2026-05-22',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 8;

-- sort_order 9: W8 - 30만원 챌린지 (성과 공유) / 검증 실험 설계 (시작)
UPDATE curriculum_weeks SET
  week_label = 'W8 - 30만원 챌린지 (성과 공유) / 검증 실험 설계 (시작)',
  topic = '30만원 챌린지 성과 공유 / 가설 수립 / 인터뷰 / 검증 실험 설계',
  objectives = '',
  assignment = '-',
  notes = '유튜브 요약 서비스',
  start_date = '2026-05-29',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 9;

-- sort_order 10: [보류] W9 - 인터뷰/검증 실험 설계
UPDATE curriculum_weeks SET
  week_label = '[보류] W9 - 인터뷰/검증 실험 설계',
  topic = '검증 실험 현황 공유',
  objectives = '',
  assignment = '-',
  notes = '실시간 주식/코인 자동 분석 리포터',
  start_date = '2026-06-04',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 10;

-- sort_order 11: W10 - 검증 실험 설계 (성과 공유) & IR 특강
UPDATE curriculum_weeks SET
  week_label = 'W10 - 검증 실험 설계 (성과 공유) & IR 특강',
  topic = 'IR 특강 / 검증 실험 결과 공유',
  objectives = 'BOOTCAMP 졸업',
  assignment = '-',
  notes = '나만의 로컬 파일 전문 비서',
  start_date = '2026-06-05',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 11;

-- sort_order 12: 🎯 아이디어톤
UPDATE curriculum_weeks SET
  week_label = '🎯 아이디어톤',
  topic = '1박2일 / 아이디어 피칭 + 팀 스피드 데이팅 + 팀 확정 + 48시간 프로젝트',
  objectives = '팀 확정',
  assignment = '-',
  notes = '',
  start_date = '2026-06-06',
  end_date = '2026-06-07'
WHERE track = 'learner' AND sort_order = 12;

-- sort_order 13: ⏸️ 1학기 기말고사 OFF
UPDATE curriculum_weeks SET
  week_label = '⏸️ 1학기 기말고사 OFF',
  topic = '시험 기간 - MVP 해커톤으로 복귀',
  objectives = '',
  assignment = '-',
  notes = '',
  start_date = '2026-06-08',
  end_date = '2026-06-19'
WHERE track = 'learner' AND sort_order = 13;

-- sort_order 14: W11 - MVP 빌드 전 구체화
UPDATE curriculum_weeks SET
  week_label = 'W11 - MVP 빌드 전 구체화',
  topic = 'MVP 정의 / 스프린트 방법론 / DB 설계 기초 / 기능 명세서 / WBS / IA / 화면 설계서 / Jira / Figjam',
  objectives = 'MVP 해커톤',
  assignment = '-',
  notes = '',
  start_date = '2026-06-20',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 14;

-- sort_order 15: 🔨 MVP 해커톤
UPDATE curriculum_weeks SET
  week_label = '🔨 MVP 해커톤',
  topic = 'MVP 완성 스프린트 (1박2일) / 바이브 코딩 교육',
  objectives = 'MVP 해커톤',
  assignment = '-',
  notes = '',
  start_date = '2026-06-27',
  end_date = '2026-06-28'
WHERE track = 'learner' AND sort_order = 15;

-- sort_order 16: W12 - MVP 개발 스프린트
UPDATE curriculum_weeks SET
  week_label = 'W12 - MVP 개발 스프린트',
  topic = '빠른 이터레이션 / API 연동 / 유저 피드백 수집',
  objectives = '',
  assignment = '',
  notes = '',
  start_date = '2026-07-03',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 16;

-- sort_order 17: W13 - 런칭
UPDATE curriculum_weeks SET
  week_label = 'W13 - 런칭',
  topic = '런칭의 기술 (온/오프라인/하이브리드) / 배포 및 모니터링',
  objectives = '',
  assignment = '만원',
  notes = '',
  start_date = '2026-07-10',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 17;

-- sort_order 18: W14 - 그로스 해킹과 유닛 이코노믹스
UPDATE curriculum_weeks SET
  week_label = 'W14 - 그로스 해킹과 유닛 이코노믹스',
  topic = '그로스 해킹 / 유닛 이코노믹스 / 획득 비용 (CAC) / 생애 가치 (LTV) / AARRR 퍼널 분석',
  objectives = '연합 활동',
  assignment = '만원',
  notes = '',
  start_date = '2026-07-17',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 18;

-- sort_order 19: W15 - 데이터 기반 의사결정 (리텐션)
UPDATE curriculum_weeks SET
  week_label = 'W15 - 데이터 기반 의사결정 (리텐션)',
  topic = '데이터 기반 의사결정 / 리텐션 차트 분석 / 이탈 지점 파악 / 코호트 분석 기법',
  objectives = '',
  assignment = '만원',
  notes = '',
  start_date = '2026-07-24',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 19;

-- sort_order 20: W16 - 피봇팅(Pivoting)의 기술
UPDATE curriculum_weeks SET
  week_label = 'W16 - 피봇팅(Pivoting)의 기술',
  topic = '피보팅 기술 / 가설 실패를 인정하는 법 / 핵심 가치만 남기고 깎아내기',
  objectives = '',
  assignment = '만원',
  notes = '',
  start_date = '2026-08-28',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 20;

-- sort_order 21: 🔥 Demo Eve 밤샘
UPDATE curriculum_weeks SET
  week_label = '🔥 Demo Eve 밤샘',
  topic = '중간 데모데이 전야제 / 피칭 리허설 / 외부 심사위원 피칭',
  objectives = E'중간 데모데이 &\n서울대 창업동아리와 합동 데모데이',
  assignment = '-',
  notes = '',
  start_date = '2026-08-29',
  end_date = '2026-08-30'
WHERE track = 'learner' AND sort_order = 21;

-- sort_order 22: W17 - 유료 마케팅과 콘텐츠 전략
UPDATE curriculum_weeks SET
  week_label = 'W17 - 유료 마케팅과 콘텐츠 전략',
  topic = '유로 마케팅 / 콘텐츠 전략 / Meta/Google 광고 기초 / 고효율 소재 제작 / AB 테스트',
  objectives = 'Demo Eve 밤샘 (8/13)',
  assignment = '3만원',
  notes = '',
  start_date = '2026-09-04',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 22;

-- sort_order 23: W18 - 바이럴 루프와 커뮤니티 빌딩
UPDATE curriculum_weeks SET
  week_label = 'W18 - 바이럴 루프와 커뮤니티 빌딩',
  topic = '바이럴 루프 / 커뮤니티 빌딩 / 유저가 유저를 불러오는 장치 설계 / 초기 팬덤 형성 전략',
  objectives = '',
  assignment = '3만원',
  notes = '',
  start_date = '2026-09-11',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 23;

-- sort_order 24: W19 - 운영 자동화와 No-Code 확장
UPDATE curriculum_weeks SET
  week_label = 'W19 - 운영 자동화와 No-Code 확장',
  topic = '운영 자동화 / No-Code 확장 / 반복적인 CS / 운영 업무 자동화(Zapier, Make 활용)',
  objectives = '',
  assignment = '3만원',
  notes = '',
  start_date = '2026-09-18',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 24;

-- sort_order 25: W20 - 중간 점검 : Death Valley 생존 보고
UPDATE curriculum_weeks SET
  week_label = 'W20 - 중간 점검 : Death Valley 생존 보고',
  topic = '지표가 안 나오는 이유 처절하게 분석하기 (Self-Roasting)',
  objectives = '연합 활동',
  assignment = '3만원',
  notes = '',
  start_date = '2026-09-25',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 25;

-- sort_order 26: W21 - B2B 영업 및 제휴 전략
UPDATE curriculum_weeks SET
  week_label = 'W21 - B2B 영업 및 제휴 전략',
  topic = '스케일링이란? / 병목 지점 찾기 / 자동화 심화',
  objectives = '',
  assignment = '10만원',
  notes = '',
  start_date = '2026-10-02',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 26;

-- sort_order 27: W22 - 수익모델 구체화
UPDATE curriculum_weeks SET
  week_label = 'W22 - 수익모델 구체화',
  topic = '구독 서비스 vs 건당 결제 / 가격 심리학과 수익 극대화 / 수익모델 구체화',
  objectives = '',
  assignment = '10만원',
  notes = '',
  start_date = '2026-10-09',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 27;

-- sort_order 28: ⏸️ 2학기 중간고사 OFF
UPDATE curriculum_weeks SET
  week_label = '⏸️ 2학기 중간고사 OFF',
  topic = '시험 기간 - IR 준비 계속 / VC 콜드메일 권장',
  objectives = '',
  assignment = '-',
  notes = '',
  start_date = '2026-10-12',
  end_date = '2026-10-23'
WHERE track = 'learner' AND sort_order = 28;

-- sort_order 29: W23 - 고객 경험(CX)과 브랜드 보이스
UPDATE curriculum_weeks SET
  week_label = 'W23 - 고객 경험(CX)과 브랜드 보이스',
  topic = '고객 경험(CX) / 브랜드 보이스 /고객 경험(CX) / 브랜드 보이스',
  objectives = '연합 활동',
  assignment = '10만원',
  notes = '',
  start_date = '2026-10-30',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 29;

-- sort_order 30: W24 - 법률 및 세무 기초
UPDATE curriculum_weeks SET
  week_label = 'W24 - 법률 및 세무 기초',
  topic = '법인 설립 / 주주간 계약서 /저작권/ 개인정보보호법',
  objectives = '',
  assignment = '10만원',
  notes = '',
  start_date = '2026-11-06',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 30;

-- sort_order 31: 🏆 Final 데모데이
UPDATE curriculum_weeks SET
  week_label = '🏆 Final 데모데이',
  topic = '최종 데모데이 준비 (1박2일) / 피칭 리허설',
  objectives = 'Final 데모데이 (11/14-15)',
  assignment = '-',
  notes = '',
  start_date = '2026-11-14',
  end_date = '2026-11-15'
WHERE track = 'learner' AND sort_order = 31;

-- sort_order 32: W25 - Product-Market Fit (PMF) 검증
UPDATE curriculum_weeks SET
  week_label = 'W25 - Product-Market Fit (PMF) 검증',
  topic = 'Sean Ellis 테스트 / 재구매율, 재방문율 기반 PMF 판단',
  objectives = '연합 활동',
  assignment = '30만원',
  notes = '',
  start_date = '2026-11-20',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 32;

-- sort_order 33: W26 - 조직 관리와 채용
UPDATE curriculum_weeks SET
  week_label = 'W26 - 조직 관리와 채용',
  topic = '초기 팀 빌딩 전략 / 컬처 핏(Culture Fit) 정의 / 면점',
  objectives = '',
  assignment = '30만원',
  notes = '',
  start_date = '2026-11-27',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 33;

-- sort_order 34: W27 - 최종 데모데이 리허설
UPDATE curriculum_weeks SET
  week_label = 'W27 - 최종 데모데이 리허설',
  topic = '5분 피칭 / 3분 Q&A 대응 전략 / 시각 자료 시인성 개선',
  objectives = 'Final 데모데이 (11/7-8)',
  assignment = '30만원',
  notes = '',
  start_date = '2026-12-04',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 34;

-- sort_order 35: W28 - 최종 데모데이
UPDATE curriculum_weeks SET
  week_label = 'W28 - 최종 데모데이',
  topic = '최종 리허설 / Q&A 마지막 준비 / 데모데이 당일 흐름',
  objectives = '',
  assignment = '100만원',
  notes = '',
  start_date = '2026-12-11',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 35;

-- sort_order 36: W29 - 회고 + 네트워킹
UPDATE curriculum_weeks SET
  week_label = 'W29 - 회고 + 네트워킹',
  topic = 'SPEC 4기 전체 회고 / 다음 단계 안내 / 알럼나이 네트워크',
  objectives = '',
  assignment = '100만원',
  notes = '',
  start_date = '2026-12-18',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 36;

-- sort_order 37: W30 - After SPEC
UPDATE curriculum_weeks SET
  week_label = 'W30 - After SPEC',
  topic = '스타트업 다음 단계 / 알럼나이 혜택 / 수료식',
  objectives = '프로그램 종료',
  assignment = '지속',
  notes = '',
  start_date = '2026-12-25',
  end_date = NULL
WHERE track = 'learner' AND sort_order = 37;

COMMIT;