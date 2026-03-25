"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const founderProfiles = [
  {
    name: "김서진",
    school: "성균관대 소프트웨어학과",
    company: "네이버",
    quote:
      "백엔드 개발자로 일하며 머신러닝에 관심이 많습니다. AI 기반 서비스를 함께 만들 동료를 찾고 있어요.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=seojin",
  },
  {
    name: "이준호",
    school: "성균관대 경영학과",
    company: "카카오",
    quote:
      "스타트업 마케팅 경험이 있습니다. 비즈니스 모델 설계와 시장 분석에 강점이 있어요.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=junho",
  },
  {
    name: "박민지",
    school: "성균관대 디자인학과",
    company: "토스",
    quote:
      "UX/UI 디자이너입니다. 사용자 중심의 제품을 만드는 것에 열정이 있습니다.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=minji",
  },
  {
    name: "최동욱",
    school: "성균관대 전자전기공학부",
    company: "삼성전자",
    quote:
      "하드웨어와 소프트웨어를 결합한 IoT 제품 개발에 관심이 많습니다.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=dongwook",
  },
  {
    name: "정수현",
    school: "성균관대 경제학과",
    company: "현대자동차",
    quote:
      "데이터 분석과 전략 기획 경험이 있습니다. 지속 가능한 비즈니스를 만들고 싶어요.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=soohyun",
  },
  {
    name: "한지우",
    school: "성균관대 글로벌경영학과",
    company: "쿠팡",
    quote:
      "e커머스와 물류 분야에서 일했습니다. 글로벌 시장을 노리는 스타트업에 관심 있어요.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=jiwoo",
  },
];

const cityStats = [
  { city: "성균관대 자연과학캠퍼스", count: "120" },
  { city: "성균관대 인문사회캠퍼스", count: "98" },
  { city: "서울", count: "85" },
  { city: "경기", count: "52" },
  { city: "인천", count: "28" },
  { city: "부산", count: "15" },
];

const testimonials = [
  {
    quote:
      "팀 매칭이 없었다면 서로 만날 기회가 없었을 거예요. 지금은 함께 프로토타입을 만들며 투자 유치를 준비하고 있습니다.",
    names: "김태현 & 이소연",
    company: "헬스케어 스타트업 준비 중",
    companyHref: "#",
    images: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=taehyun",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=soyeon",
    ],
  },
  {
    quote:
      "SPEC 팀 매칭은 진심으로 창업을 준비하는 사람들을 필터링해주는 큰 장점이 있어요. 시간을 절약하고 정말 맞는 사람을 찾을 수 있었습니다.",
    names: "박준영 & 최민수",
    company: "에듀테크 스타트업",
    companyHref: "#",
    images: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=junyoung",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=minsu",
    ],
  },
  {
    quote:
      "적합한 공동창업자를 찾는 것이 항상 가장 큰 장벽이었어요. 팀 매칭을 통해 매일 함께 작업하는 파트너를 만났고, 지금까지 멈추지 않고 달려오고 있습니다.",
    names: "한지민 & 정우진",
    company: "핀테크 스타트업",
    companyHref: "#",
    images: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=jimin",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=woojin",
    ],
  },
  {
    quote:
      "SPEC 1기 때 팀 매칭으로 만나 함께 데모데이를 준비했습니다. 서로 보완적인 역량 덕분에 시너지가 정말 좋았어요.",
    names: "오현석 & 강예린",
    company: "SPEC 1기",
    companyHref: "#",
    images: [
      "https://api.dicebear.com/7.x/avataaars/svg?seed=hyunseok",
      "https://api.dicebear.com/7.x/avataaars/svg?seed=yerin",
    ],
  },
];

const howItWorksSteps = [
  { num: "1", text: "프로필을 등록하고 자신에 대해 소개해주세요" },
  {
    num: "2",
    text: "매칭 알고리즘이 당신의 선호에 맞는 프로필을 보여줍니다",
  },
  {
    num: "3",
    text: "관심있는 프로필이 있다면 연결 요청을 보내세요",
  },
  {
    num: "4",
    text: "상대방이 수락하면 매칭 완료! 대화를 시작할 시간을 정하세요.",
  },
];

const faqs = [
  {
    q: "누가 사용할 수 있나요?",
    a: "공동창업자를 찾는 모든 분이 사용할 수 있습니다. 아이디어가 있어도 좋고, 아직 탐색 중이어도 괜찮습니다. 이미 스타트업에 풀타임으로 일하고 있거나, 앞으로 창업에 관심이 있는 분 모두 환영합니다.",
  },
  {
    q: "사용료가 있나요? 지분을 요구하나요?",
    a: "아니요, 팀 매칭은 완전히 무료 서비스입니다.",
  },
  {
    q: "아직 창업을 확신하지 못했는데, 사람을 만나보기 위해 사용해도 되나요?",
    a: "물론입니다. 팀 매칭은 창업에 관심있는 멋진 사람들을 만나는 좋은 방법입니다.",
  },
  {
    q: "프로필이 공개되나요? 직장에서 알 수 있나요?",
    a: "아니요, 프로필은 인터넷에 공개되지 않습니다. 팀 매칭 승인을 받은 사람들에게만 보입니다.",
  },
];

function ProfileCard({
  profile,
}: {
  profile: (typeof founderProfiles)[number];
}) {
  return (
    <div className="flex min-w-[260px] max-w-[340px] flex-col rounded-2xl bg-white p-5 sm:p-6 shadow-sm">
      <p className="mb-4 font-['Pretendard',sans-serif] text-sm font-normal leading-relaxed text-[#16140f]/80">
        {profile.quote}
      </p>
      <div className="mt-auto flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#e8e8e0]">
          <Image
            src={profile.image}
            alt={profile.name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
        <div>
          <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
            {profile.name}
          </p>
          <p className="font-['Pretendard',sans-serif] text-xs font-normal text-[#16140f]/60">
            {profile.school} &middot; {profile.company}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CofounderMatchingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

   return (
     <div className="overflow-hidden pb-24">
      <section className="relative px-4 pb-16 pt-14 text-center sm:pt-20 lg:pt-24 md:pt-20">
        <div className="mx-auto max-w-[800px]">
          <div className="mb-6">
            <div className="text-6xl">🤝</div>
          </div>
          <h1 className="font-[system-ui] font-black tracking-tight uppercase text-[#16140f] text-[clamp(2.5rem,5vw,3.75rem)]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            <span className="font-['Pretendard',sans-serif] text-lg font-medium tracking-wider text-[#FF6C0F] sm:text-xl">
              SPEC
            </span>
            <br />
            Team Matching
          </h1>
          <p className="mt-5 font-['Pretendard',sans-serif] text-lg font-normal text-[#16140f]/70 sm:text-xl">
            아이디어는 있지만 팀이 없나요? SPEC 팀 매칭으로 함께할 동료를 찾으세요
          </p>
           <div className="mt-8 flex items-center justify-center gap-4">
             <Link
               href="/apply"
               className="rounded-full bg-[#FF6C0F] px-8 py-3 font-['Pretendard',sans-serif] text-sm font-medium text-white transition-opacity hover:opacity-90"
             >
               프로필 등록
             </Link>
             <Link
               href="/about"
               className="rounded-full border border-[#16140f]/20 px-8 py-3 font-['Pretendard',sans-serif] text-sm font-medium text-[#16140f] transition-colors hover:bg-[#16140f]/5"
             >
               더 알아보기
             </Link>
           </div>
          <p className="mt-6 font-['Pretendard',sans-serif] text-xs font-normal italic text-[#16140f]/50">
            (실제 SPEC 회원들이 팀 매칭을 통해 만났습니다.)
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="font-['MaruBuri',serif] text-2xl font-normal leading-relaxed text-[#16140f] sm:text-3xl">
            좋은 아이디어가 있어도 함께할 팀원이 없다면 시작하기 어렵습니다
          </p>
          <p className="mt-6 font-['MaruBuri',serif] text-2xl font-bold text-[#16140f] sm:text-3xl">
            그래서 SPEC 팀 매칭을 만들었습니다.
          </p>
        </div>
        <div className="mx-auto mt-14 grid max-w-[1000px] gap-8 sm:grid-cols-3">
          {[
            {
              title: "모든 단계에 적합",
              desc: "미래를 위해 사람을 알아가는 중이든, 당장 시작할 준비가 되어 있든 괜찮습니다.",
            },
            {
              title: "아이디어 유무 무관",
              desc: "아직 적합한 아이디어가 없나요? 팀 매칭에서 함께 찾아보세요.",
            },
            {
              title: "자유로운 탐색",
              desc: "의무사항 없음, 지분 요구 없음, 조건 없음.",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <h3 className="font-['Pretendard',sans-serif] text-base font-semibold text-[#16140f]">
                {item.title}
              </h3>
              <p className="mt-2 font-['Pretendard',sans-serif] text-sm font-normal text-[#16140f]/70">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#eae9e2] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="mb-10 text-center font-['MaruBuri',serif] text-3xl font-bold text-[#16140f] sm:text-4xl">
            다양한 배경의 창업 지망생들이 팀 매칭을 사용합니다
          </h2>
          <div className="scrollbar-none -mx-4 flex gap-5 overflow-x-auto px-4 pb-4">
            {founderProfiles.map((profile) => (
              <ProfileCard key={profile.name} profile={profile} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="font-['MaruBuri',serif] text-3xl font-bold text-[#16140f] sm:text-4xl">
            성균관대 최대 네트워크 &mdash; 400명 이상의 활성 회원
          </h2>
          <p className="mt-4 font-['Pretendard',sans-serif] text-base font-normal text-[#16140f]/70">
            지역별 활성 프로필
          </p>
          <div className="mx-auto mt-10 grid max-w-[700px] grid-cols-2 gap-x-12 gap-y-4 text-left sm:grid-cols-2">
            {cityStats.map((stat) => (
              <div
                key={stat.city}
                className="flex items-center justify-between border-b border-[#e8e8e0] py-3"
              >
                <span className="font-['Pretendard',sans-serif] text-sm font-normal text-[#16140f]/80">
                  {stat.city}
                </span>
                <span className="font-['Pretendard',sans-serif] text-sm font-semibold tabular-nums text-[#16140f]">
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 font-['Pretendard',sans-serif] text-sm font-normal italic text-[#16140f]/60">
            SPEC은 오프라인 팀 매칭 밋업도 정기적으로 개최합니다
          </p>
        </div>
      </section>

      <section className="bg-[#eae9e2] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[800px] text-center">
          <h2 className="font-['MaruBuri',serif] text-3xl font-bold text-[#16140f] sm:text-4xl">
            SPEC의 노하우가 담긴 매칭 시스템
          </h2>
          <p className="mt-4 font-['Pretendard',sans-serif] text-base font-normal leading-relaxed text-[#16140f]/70">
            성공적인 창업팀의 구성 요소에 대한 SPEC의 경험과 통찰을 매칭 알고리즘에 녹였습니다.
            실행력, 보완적 스킬셋, 공유된 비전을 중심으로 최적의 팀원을 찾아드립니다.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-10 text-center font-['MaruBuri',serif] text-3xl font-bold text-[#16140f] sm:text-4xl">
            팀 매칭으로 만난 SPEC 회원들의 이야기
          </h2>
          <div className="space-y-10">
            {testimonials.map((t) => (
              <div
                key={t.names}
                className="rounded-2xl border border-[#e8e8e0] bg-white p-8"
              >
                <p className="mb-6 font-['Pretendard',sans-serif] text-base font-normal leading-relaxed text-[#16140f]/80">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {t.images.map((img, i) => (
                       <div
                         key={i}
                         className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-[#e8e8e0]"
                       >
                         <Image
                           src={img}
                           alt="회원 프로필 사진"
                           width={40}
                           height={40}
                           className="h-full w-full object-cover"
                           unoptimized
                         />
                       </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                      {t.names}
                    </p>
                     <span className="font-['Pretendard',sans-serif] text-xs font-normal text-[#FF6C0F]">
                       {t.company}
                     </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

       <section className="bg-[#FF6C0F] px-4 py-12 text-center">
         <Link
           href="/apply"
           className="inline-block rounded-full bg-white px-10 py-3.5 font-['Pretendard',sans-serif] text-sm font-semibold text-[#FF6C0F] transition-opacity hover:opacity-90"
         >
           지금 시작하기
         </Link>
       </section>

       <section className="px-4 py-16 sm:py-20">
         <div className="mx-auto max-w-[800px]">
           <h2 className="mb-12 text-center font-['MaruBuri',serif] text-3xl font-bold text-[#16140f] sm:text-4xl">
             어떻게 작동하나요?
           </h2>
          <div className="space-y-8">
            {howItWorksSteps.map((step) => (
              <div key={step.num} className="flex items-start gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6C0F] font-['Pretendard',sans-serif] text-lg font-bold text-white">
                  {step.num}
                </div>
                <p className="pt-2 font-['Pretendard',sans-serif] text-base font-normal text-[#16140f]/80">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eae9e2] px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-[800px]">
          <h2 className="mb-8 text-center font-['MaruBuri',serif] text-3xl font-bold text-[#16140f]">
            자주 묻는 질문
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl bg-white"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
                    {faq.q}
                  </span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-[#16140f]/40 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M6 8L10 12L14 8"
                      strokeWidth="2"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="font-['Pretendard',sans-serif] text-sm font-normal leading-relaxed text-[#16140f]/70">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

       <section className="bg-[#FF6C0F] px-4 py-12 text-center">
         <Link
           href="/apply"
           className="inline-block rounded-full bg-white px-10 py-3.5 font-['Pretendard',sans-serif] text-sm font-semibold text-[#FF6C0F] transition-opacity hover:opacity-90"
         >
           지금 시작하기
         </Link>
       </section>
     </div>
   );
 }
