/* eslint-disable @next/next/no-img-element */
export default function About() {
  const photoStripImages = [
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop",
  ];

  const members = {
    seojun: {
      name: "김서준",
      bio: "1기 수료 · AI 스타트업 창업",
      photo:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    },
    haeun: {
      name: "이하은",
      bio: "2기 수료 · 에듀테크 팀 리더",
      photo:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    },
    hyunwoo: {
      name: "박현우",
      bio: "2기 수료 · 커머스 플랫폼 공동창업",
      photo:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    },
    yuna: {
      name: "최유나",
      bio: "3기 수료 · 헬스케어 스타트업",
      photo:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    },
    minjae: {
      name: "정민재",
      bio: "1기 수료 · SaaS 파운더",
      photo:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    },
    soyul: {
      name: "한소율",
      bio: "3기 수료 · 핀테크 프로젝트",
      photo:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    },
  };

  return (
    <section className="py-20 bg-transparent">
      <div className="mx-auto flex max-w-[550px] flex-col gap-7 px-5">
        {/* Part 1: SPEC Story */}
        <div className="flex flex-col gap-7">
          <p className="font-['MaruBuri',serif] text-[1.35rem] leading-[1.7] text-white first-letter:float-left first-letter:mr-3 first-letter:text-[7.6rem] first-letter:font-bold first-letter:leading-[0.75] first-letter:text-[#FF6C0F]">
            SPEC은 성균관대학교에서 시작된 창업 학회입니다. 우리는
            &lsquo;실행&rsquo;만을 믿습니다. 강의실에서 이론을 배우는 대신, 첫
            주부터 직접 돈을 벌고, 팀을 만들고, 제품을 런칭합니다.
          </p>
          <p className="font-['MaruBuri',serif] text-[1.35rem] leading-[1.7] text-white/90">
            30주 동안 매주 매출 챌린지를 수행하며, 10만원에서 시작해 1억을
            향해 달립니다. 카카오모빌리티와 함께 멘토링을 받고, RISE 사업단의 VCC
            미니 MBA를 병행하며, 데모데이에서 투자자 앞에 섭니다.
          </p>
          <p className="font-['MaruBuri',serif] text-[1.35rem] leading-[1.7] text-white/90">
            SPEC은 데모데이에서 끝나지 않습니다. 알럼나이 네트워크를 통해 창업
            여정을 계속 함께합니다. 우리의 목표는 하나 — 성균관대의 창업자들이
            대한민국을, 세계를 짚어삼키는 것.
          </p>
        </div>

        {/* Part 2: Photo Strip */}
        <div className="my-8 -ml-[calc(50vw-50%)] flex w-screen gap-3 overflow-hidden px-5">
          {photoStripImages.map((src, index) => (
            <img
              key={index}
              src={src}
              alt="SPEC 활동 사진"
              loading="lazy"
              className={`aspect-square min-w-0 flex-1 rounded-lg object-cover ${
                index >= 3 ? "max-md:hidden" : ""
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm italic text-white/50">
          📸 실제 SPEC 활동 사진을 여기에 넣어주세요
        </p>

        {/* Part 3: Member Testimonials */}
        <div className="flex flex-col gap-6">
           <h2 className="font-['Pretendard',sans-serif] text-sm font-semibold uppercase tracking-[0.06em] text-white/70">
            멤버들의 이야기
          </h2>

          <div className="flex flex-col gap-7">
            {/* Testimonial 1 */}
            <div className="relative m-0">
               <span className="inline py-1.5 text-[1.35rem] font-normal leading-[1.7] font-['MaruBuri',serif] text-white underline decoration-white/20 underline-offset-[3px] transition-all duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                 SPEC은 몇 달치 성장을 몇 주로 압축합니다.
              </span>
              <span className="group/avatar relative inline-block align-middle mx-1.5">
                <button
                  className="inline-block cursor-pointer border-0 bg-transparent p-0 transition-all"
                  aria-label={members.seojun.name}
                >
                  <img
                    src={members.seojun.photo}
                    alt={members.seojun.name}
                    loading="lazy"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-[1000] ml-3 flex h-[240px] w-[200px] -translate-y-1/2 items-end overflow-hidden rounded-xl opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 max-[1100px]:hidden">
                  <div className="absolute inset-0 z-[1] h-full w-full after:absolute after:inset-0 after:z-[2] after:bg-gradient-to-b after:from-transparent after:via-transparent after:via-50% after:to-black/85 after:content-['']">
                    <img
                      src={members.seojun.photo}
                      alt={members.seojun.name}
                      className="block h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative z-[3] w-full p-4 text-left">
                    <h3 className="m-0 mb-1 font-['Source_Serif_4',serif] text-[0.95rem] font-medium leading-[1.3] tracking-[-0.01em] text-white">
                      {members.seojun.name}
                    </h3>
                    <p className="m-0 mb-1 font-['Outfit',sans-serif] text-xs font-normal leading-[1.3] text-white/85">
                      {members.seojun.bio}
                    </p>
                  </div>
                </div>
              </span>
               <span className="inline py-1.5 text-[1.35rem] font-normal leading-[1.7] font-['MaruBuri',serif] text-white/80 underline decoration-white/15 underline-offset-[3px] transition-all duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                 매주 매출 챌린지를 하면서 &lsquo;빠르게 실패하는 법&rsquo;을
                 체득했습니다.
              </span>
              <span className="group/avatar relative inline-block align-middle mx-1.5">
                <button
                  className="inline-block cursor-pointer border-0 bg-transparent p-0 transition-all"
                  aria-label={members.haeun.name}
                >
                  <img
                    src={members.haeun.photo}
                    alt={members.haeun.name}
                    loading="lazy"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-[1000] ml-3 flex h-[240px] w-[200px] -translate-y-1/2 items-end overflow-hidden rounded-xl opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 max-[1100px]:hidden">
                  <div className="absolute inset-0 z-[1] h-full w-full after:absolute after:inset-0 after:z-[2] after:bg-gradient-to-b after:from-transparent after:via-transparent after:via-50% after:to-black/85 after:content-['']">
                    <img
                      src={members.haeun.photo}
                      alt={members.haeun.name}
                      className="block h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative z-[3] w-full p-4 text-left">
                    <h3 className="m-0 mb-1 font-['Source_Serif_4',serif] text-[0.95rem] font-medium leading-[1.3] tracking-[-0.01em] text-white">
                      {members.haeun.name}
                    </h3>
                    <p className="m-0 mb-1 font-['Outfit',sans-serif] text-xs font-normal leading-[1.3] text-white/85">
                      {members.haeun.bio}
                    </p>
                  </div>
                </div>
              </span>
            </div>

            {/* Testimonial 2 */}
            <div className="relative m-0">
               <span className="inline py-1.5 text-[1.35rem] font-normal leading-[1.7] font-['MaruBuri',serif] text-white underline decoration-white/20 underline-offset-[3px] transition-all duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                 다른 곳에서는 찾을 수 없는 창업가 커뮤니티입니다.
              </span>
              <span className="group/avatar relative inline-block align-middle mx-1.5">
                <button
                  className="inline-block cursor-pointer border-0 bg-transparent p-0 transition-all"
                  aria-label={members.hyunwoo.name}
                >
                  <img
                    src={members.hyunwoo.photo}
                    alt={members.hyunwoo.name}
                    loading="lazy"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-[1000] ml-3 flex h-[240px] w-[200px] -translate-y-1/2 items-end overflow-hidden rounded-xl opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 max-[1100px]:hidden">
                  <div className="absolute inset-0 z-[1] h-full w-full after:absolute after:inset-0 after:z-[2] after:bg-gradient-to-b after:from-transparent after:via-transparent after:via-50% after:to-black/85 after:content-['']">
                    <img
                      src={members.hyunwoo.photo}
                      alt={members.hyunwoo.name}
                      className="block h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative z-[3] w-full p-4 text-left">
                    <h3 className="m-0 mb-1 font-['Source_Serif_4',serif] text-[0.95rem] font-medium leading-[1.3] tracking-[-0.01em] text-white">
                      {members.hyunwoo.name}
                    </h3>
                    <p className="m-0 mb-1 font-['Outfit',sans-serif] text-xs font-normal leading-[1.3] text-white/85">
                      {members.hyunwoo.bio}
                    </p>
                  </div>
                </div>
              </span>
               <span className="inline py-1.5 text-[1.35rem] font-normal leading-[1.7] font-['MaruBuri',serif] text-white/80 underline decoration-white/15 underline-offset-[3px] transition-all duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                 동기들의 열정과 긴장감이 전염되어 인생에서 가장 생산적인
                 시기였습니다.
              </span>
              <span className="group/avatar relative inline-block align-middle mx-1.5">
                <button
                  className="inline-block cursor-pointer border-0 bg-transparent p-0 transition-all"
                  aria-label={members.yuna.name}
                >
                  <img
                    src={members.yuna.photo}
                    alt={members.yuna.name}
                    loading="lazy"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-[1000] ml-3 flex h-[240px] w-[200px] -translate-y-1/2 items-end overflow-hidden rounded-xl opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 max-[1100px]:hidden">
                  <div className="absolute inset-0 z-[1] h-full w-full after:absolute after:inset-0 after:z-[2] after:bg-gradient-to-b after:from-transparent after:via-transparent after:via-50% after:to-black/85 after:content-['']">
                    <img
                      src={members.yuna.photo}
                      alt={members.yuna.name}
                      className="block h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative z-[3] w-full p-4 text-left">
                    <h3 className="m-0 mb-1 font-['Source_Serif_4',serif] text-[0.95rem] font-medium leading-[1.3] tracking-[-0.01em] text-white">
                      {members.yuna.name}
                    </h3>
                    <p className="m-0 mb-1 font-['Outfit',sans-serif] text-xs font-normal leading-[1.3] text-white/85">
                      {members.yuna.bio}
                    </p>
                  </div>
                </div>
              </span>
            </div>

            {/* Testimonial 3 */}
            <div className="relative m-0">
               <span className="inline py-1.5 text-[1.35rem] font-normal leading-[1.7] font-['MaruBuri',serif] text-white underline decoration-white/20 underline-offset-[3px] transition-all duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                 SPEC을 거치고 나면 &lsquo;빠름&rsquo;이 뭔지 완전히 새로운
                 감각으로 깨닫게 됩니다.
              </span>
              <span className="group/avatar relative inline-block align-middle mx-1.5">
                <button
                  className="inline-block cursor-pointer border-0 bg-transparent p-0 transition-all"
                  aria-label={members.minjae.name}
                >
                  <img
                    src={members.minjae.photo}
                    alt={members.minjae.name}
                    loading="lazy"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-[1000] ml-3 flex h-[240px] w-[200px] -translate-y-1/2 items-end overflow-hidden rounded-xl opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 max-[1100px]:hidden">
                  <div className="absolute inset-0 z-[1] h-full w-full after:absolute after:inset-0 after:z-[2] after:bg-gradient-to-b after:from-transparent after:via-transparent after:via-50% after:to-black/85 after:content-['']">
                    <img
                      src={members.minjae.photo}
                      alt={members.minjae.name}
                      className="block h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative z-[3] w-full p-4 text-left">
                    <h3 className="m-0 mb-1 font-['Source_Serif_4',serif] text-[0.95rem] font-medium leading-[1.3] tracking-[-0.01em] text-white">
                      {members.minjae.name}
                    </h3>
                    <p className="m-0 mb-1 font-['Outfit',sans-serif] text-xs font-normal leading-[1.3] text-white/85">
                      {members.minjae.bio}
                    </p>
                  </div>
                </div>
              </span>
               <span className="inline py-1.5 text-[1.35rem] font-normal leading-[1.7] font-['MaruBuri',serif] text-white/80 underline decoration-white/15 underline-offset-[3px] transition-all duration-200 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                 바이브코딩으로 비개발자인 제가 직접 MVP를 만들 수 있게 됐습니다.
              </span>
              <span className="group/avatar relative inline-block align-middle mx-1.5">
                <button
                  className="inline-block cursor-pointer border-0 bg-transparent p-0 transition-all"
                  aria-label={members.soyul.name}
                >
                  <img
                    src={members.soyul.photo}
                    alt={members.soyul.name}
                    loading="lazy"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
                <div className="pointer-events-none absolute left-full top-1/2 z-[1000] ml-3 flex h-[240px] w-[200px] -translate-y-1/2 items-end overflow-hidden rounded-xl opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover/avatar:pointer-events-auto group-hover/avatar:opacity-100 max-[1100px]:hidden">
                  <div className="absolute inset-0 z-[1] h-full w-full after:absolute after:inset-0 after:z-[2] after:bg-gradient-to-b after:from-transparent after:via-transparent after:via-50% after:to-black/85 after:content-['']">
                    <img
                      src={members.soyul.photo}
                      alt={members.soyul.name}
                      className="block h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative z-[3] w-full p-4 text-left">
                    <h3 className="m-0 mb-1 font-['Source_Serif_4',serif] text-[0.95rem] font-medium leading-[1.3] tracking-[-0.01em] text-white">
                      {members.soyul.name}
                    </h3>
                    <p className="m-0 mb-1 font-['Outfit',sans-serif] text-xs font-normal leading-[1.3] text-white/85">
                      {members.soyul.bio}
                    </p>
                  </div>
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
