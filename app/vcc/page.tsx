import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VCC | Venture Creation Course — SPEC',
  description:
    '성균관대 RISE 사업단 × SPEC 공동 운영 미니 MBA. 비즈니스 모델링부터 IR 피칭까지 창업의 전 과정을 체계적으로 학습합니다.',
};

const modules = [
  {
    num: 1,
    title: '비즈니스 모델 설계',
    desc: '린 캔버스, BMC, 가치 제안 설계',
  },
  {
    num: 2,
    title: '시장 분석 & 검증',
    desc: 'TAM/SAM/SOM, 경쟁 분석, 고객 인터뷰',
  },
  {
    num: 3,
    title: '재무 모델링',
    desc: '매출 예측, 비용 구조, 유닛 이코노믹스',
  },
  {
    num: 4,
    title: '마케팅 & 그로스',
    desc: 'Go-to-Market, 퍼포먼스 마케팅, 그로스 해킹',
  },
  {
    num: 5,
    title: '법률 & 팀 빌딩',
    desc: '법인 설립, 지분 구조, 채용 전략',
  },
  {
    num: 6,
    title: 'IR & 투자 유치',
    desc: '피치덱, 재무 모델, 모의 IR, VC 네트워킹',
  },
];

const mentors = [
  {
    name: 'Peter Kim',
    role: '전략 컨설턴트',
    company: '前 McKinsey',
    photo: '',
    bio: '맥킨지에서 10년간 전략 컨설팅을 수행한 후, 스타트업 생태계로 전환. 현재 다수의 초기 스타트업에 전략 자문을 제공하고 있습니다.',
  },
  {
    name: 'Sarah Lee',
    role: '스타트업 투자심사역',
    company: '前 알토스벤처스',
    photo: '',
    bio: '알토스벤처스에서 시드~시리즈A 투자심사를 담당. 50+ 스타트업 심사 경험을 바탕으로 IR 전략과 투자 유치 노하우를 전수합니다.',
  },
  {
    name: 'David Park',
    role: '연쇄 창업가',
    company: '2x Exit Founder',
    photo: '',
    bio: '2번의 성공적인 엑싯을 경험한 연쇄 창업가. 제품 개발부터 팀 빌딩, 스케일링까지 실전 경험을 공유합니다.',
  },
  {
    name: 'Jimin Choi',
    role: '그로스 해커',
    company: '前 카카오모빌리티',
    photo: '',
    bio: '카카오모빌리티 그로스팀 출신. 데이터 기반 의사결정과 그로스 해킹 전략의 전문가입니다.',
  },
];

export default function VCCPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      <section className="flex min-h-[40vh] flex-col items-center justify-center px-6 pt-14 pb-16 md:pt-20 md:pb-16">
         <span className="mb-6 rounded-full border border-white/20 px-4 py-1 text-xs text-white/60">
           SKKU RISE × SPEC
         </span>
        <h1
          className="text-center text-[clamp(2.5rem,5vw,3.75rem)] font-black uppercase tracking-tight leading-[1.15] text-white"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Venture Creation Course
        </h1>
        <p className="mt-4 text-center font-['MaruBuri',serif] text-lg text-white/60">
          성균관대 RISE 사업단 × SPEC 공동 운영 미니 MBA
        </p>
      </section>

       <section className="mx-auto max-w-3xl px-6 py-16 pt-14 md:pt-20">
         <div className="flex flex-col gap-8">
           <p className="font-['MaruBuri',serif] text-[1.15rem] leading-[1.8] text-white/80">
            VCC(Venture Creation Course)는 성균관대학교 RISE 사업단이 주관하고
            SPEC이 공동 운영하는 실전 창업 교육 프로그램입니다. 단순한 이론 강의가
            아닌, 실제 사업을 운영하며 배우는 체험형 MBA 커리큘럼으로, SPEC 정규
            프로그램과 시너지를 내어 창업자로서의 역량을 극대화합니다.
          </p>
           <p className="font-['MaruBuri',serif] text-[1.15rem] leading-[1.8] text-white/80">
             매주 전문 멘토진의 강의와 워크샵을 통해 비즈니스 모델 설계, 시장 분석,
             재무 모델링, 마케팅 전략, IR 피칭 등 창업의 전 과정을 체계적으로
             학습합니다. 카카오모빌리티를 포함한 주요 기업 출신 현직자들이 멘토로
             참여하여 실무 관점의 피드백을 제공합니다.
           </p>
        </div>
      </section>

       <section className="mx-auto max-w-[1100px] px-6 py-16 pt-14 md:pt-20">
          <h2
            className="mb-4 text-center text-[clamp(1.5rem,3vw,2.5rem)] font-black uppercase tracking-tight leading-[1.15] text-white"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Curriculum
          </h2>
         <p className="mb-12 text-center font-['MaruBuri',serif] text-base text-white/60">
           비즈니스의 기초부터 IR까지, 6개 모듈 집중 교육
         </p>

         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {modules.map((mod) => (
            <div
              key={mod.num}
              className="group flex items-start gap-5 rounded-xl border border-white/10 bg-white/5 p-6 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.08]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F] text-sm font-bold text-white">
                {mod.num}
              </span>
              <div>
                <h3 className="font-['Pretendard',sans-serif] text-lg font-semibold text-white">
                  {mod.title}
                </h3>
                 <p className="mt-1 font-['Pretendard',sans-serif] text-sm text-white/60">
                   {mod.desc}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </section>

       <section className="mx-auto max-w-[1100px] px-6 py-16 pt-14 md:pt-20">
         <h2
           className="mb-4 text-center text-[clamp(1.5rem,3vw,2.5rem)] font-black uppercase tracking-tight leading-[1.15] text-white"
           style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
         >
           Mentors
         </h2>
         <p className="mb-14 text-center font-['Pretendard',sans-serif] text-sm text-white/50">
           현업 전문가들이 직접 지도합니다
         </p>

         <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.name}
              className="flex flex-col items-center text-center"
            >
              {mentor.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.photo}
                  alt={mentor.name}
                  loading="lazy"
                  className="h-32 w-32 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="grid h-32 w-32 place-items-center rounded-full bg-white/10 ring-2 ring-white/10">
                  <span className="font-['Pretendard',sans-serif] text-3xl font-semibold text-white/80">
                    {mentor.name.charAt(0)}
                  </span>
                </div>
              )}
              <h3 className="mt-5 font-['Pretendard',sans-serif] text-base font-semibold text-white">
                {mentor.name}
              </h3>
              <span className="font-['Pretendard',sans-serif] text-sm text-white/60">
                {mentor.role}
              </span>
              <span className="mb-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#FF6C0F]">
                {mentor.company}
              </span>
               <p className="font-['MaruBuri',serif] text-sm leading-relaxed text-white/60">
                 {mentor.bio}
               </p>
            </div>
          ))}
        </div>
      </section>

       <section className="border-t border-white/10 py-20 pt-14 md:pt-20">
         <div className="mx-auto max-w-2xl px-6 text-center">
           <h2
             className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-tight leading-[1.15] text-white"
             style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
           >
             SPEC 4기에 지원하고
             <br />
             VCC를 함께 경험하세요
           </h2>
           <p className="mt-4 font-['MaruBuri',serif] text-base text-white/60">
             창업의 전 과정을 체계적으로 배울 수 있는 기회를 놓치지 마세요.
           </p>
           <Link
             href="/apply"
             className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#FF6C0F] px-8 py-3.5 font-['Pretendard',sans-serif] text-sm font-semibold text-white transition-all duration-300 hover:bg-[#e55d0a]"
           >
            지원하기
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M6 3L11 8L6 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
