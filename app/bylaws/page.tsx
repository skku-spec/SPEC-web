import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회칙 | SPEC",
  description: "SPEC 성균관대학교 창업학회 회칙",
};

export default function BylawsPage() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 pb-24 pt-14 md:pt-20">
      <div className="mb-8 text-center">
        <h1
          className="font-[system-ui] text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.15] tracking-tight uppercase text-[#16140f]"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          Bylaws
        </h1>
        <p className="mt-2 font-['Pretendard',sans-serif] text-base text-[#16140f]/60">
          SPEC 학회 회칙
        </p>
      </div>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-12 md:flex-row-reverse">
        <nav className="shrink-0 md:w-[170px]">
          <ul className="sticky top-24 space-y-1 font-['Pretendard',sans-serif] text-sm">
            <li className="mb-2 font-medium text-[#16140f]">목차</li>
            <li>
              <a href="#general" className="text-[#FF6C0F] hover:underline">
                총칙
              </a>
            </li>
            <li>
              <a href="#membership" className="text-[#FF6C0F] hover:underline">
                회원
              </a>
            </li>
            <li>
              <a href="#fees" className="text-[#FF6C0F] hover:underline">
                회비
              </a>
            </li>
            <li>
              <a href="#attendance" className="text-[#FF6C0F] hover:underline">
                출석
              </a>
            </li>
            <li>
              <a href="#assignments" className="text-[#FF6C0F] hover:underline">
                과제
              </a>
            </li>
            <li>
              <a href="#operations" className="text-[#FF6C0F] hover:underline">
                운영
              </a>
            </li>
            <li>
              <a href="#discipline" className="text-[#FF6C0F] hover:underline">
                징계 및 제명
              </a>
            </li>
            <li>
              <a href="#etc" className="text-[#FF6C0F] hover:underline">
                기타
              </a>
            </li>
          </ul>
        </nav>

        <article className="min-w-0 flex-1 font-['Pretendard',sans-serif] text-base leading-relaxed text-[#16140f]">
          {/* ==================== 제1장 총칙 ==================== */}
          <section id="general" className="scroll-mt-24">
            <h2 className="mb-2 font-['MaruBuri',serif] text-2xl font-semibold">
              제1장 총칙
            </h2>
            <p className="mb-6 text-sm text-[#16140f]/60">
              시행일: 2026년 3월 27일
            </p>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제1조 (명칭)
            </h3>
            <p className="mb-6">
              본 학회는 &ldquo;SPEC&rdquo;(이하
              &ldquo;학회&rdquo;)이라 한다.
            </p>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제2조 (목적)
            </h3>
            <p className="mb-6">
              학회는 성균관대학교 재학생 및 휴학생을 대상으로 창업 역량 강화,
              팀 프로젝트 수행, 네트워킹 기회 제공을 목적으로 한다.
            </p>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제3조 (소재지)
            </h3>
            <p className="mb-8">
              학회의 주된 활동 장소는 성균관대학교 인문사회과학캠퍼스로 한다.
            </p>
          </section>

          {/* ==================== 제2장 회원 ==================== */}
          <section id="membership" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제2장 회원
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제4조 (회원 구분)
            </h3>
            <p className="mb-4">
              학회의 회원은 다음과 같이 구분한다.
            </p>
            <ul className="mb-6 list-disc space-y-2 pl-8">
              <li>
                <strong>러너 (Learner)</strong> &mdash; 정규 모집을 통해
                선발되어 해당 기수 프로그램에 참여하는 회원
              </li>
              <li>
                <strong>프러너 (Preneur)</strong> &mdash; 러너 과정을 수료한
                후 운영진으로 활동하는 회원
              </li>
              <li>
                <strong>알럼나이 (Alumni)</strong> &mdash; 프로그램을 수료하고
                졸업한 회원
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제5조 (가입 자격 및 절차)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                러너 지원 자격은 성균관대학교 재학생, 휴학생, 수료생,
                대학원생으로 한다.
              </li>
              <li>
                가입은 학회가 공고한 정규 모집 기간 내 서류 접수 &rarr; 면접
                &rarr; 최종 합격 &rarr; OT 참석의 절차를 거친다.
              </li>
              <li>
                OT(오리엔테이션)는 필참이며, 불참 시 합격이 취소될 수 있다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제6조 (회원 자격 유지)
            </h3>
            <ul className="mb-8 list-decimal space-y-2 pl-8">
              <li>
                회원은 본 회칙을 준수하고, 정기 모임 및 학회 활동에 성실히
                참여하여야 한다.
              </li>
              <li>
                회원 자격은 해당 기수 프로그램 종료(데모데이 포함) 시까지
                유지되며, 수료 후 알럼나이로 전환된다.
              </li>
            </ul>
          </section>

          {/* ==================== 제3장 회비 ==================== */}
          <section id="fees" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제3장 회비
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제7조 (회비 금액 및 납부)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                회비는 기수당 <strong>40,000원</strong>으로 한다.
              </li>
              <li>
                회비는 최종 합격 통보 후 OT 전일까지 납부하여야 한다.
              </li>
              <li>
                회비에는 프로그램 자료, 활동비, 간식비 등이 포함된다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제8조 (환불 정책)
            </h3>
            <div className="mb-4 rounded-lg border border-[#16140f]/10 bg-[#16140f]/[0.03] p-4">
              <p className="font-semibold">
                회비는 납부 후 어떠한 사유로도 환불하지 않는다.
              </p>
            </div>
            <ul className="mb-8 list-decimal space-y-2 pl-8">
              <li>
                본인의 의사에 의한 중도 탈퇴, 제명, 기타 사유를 불문하고
                환불이 불가하다.
              </li>
              <li>
                다만, 학회의 귀책사유(프로그램 전면 취소 등)로 활동이
                불가능한 경우 운영진 회의를 거쳐 환불 여부를 결정할 수 있다.
              </li>
            </ul>
          </section>

          {/* ==================== 제4장 출석 ==================== */}
          <section id="attendance" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제4장 출석
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제9조 (정기 모임)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                정기 모임은 매주 <strong>금요일</strong>에 진행한다.
              </li>
              <li>
                정기 모임의 시간과 장소는 기수 초에 공지하며, 변경 시 최소
                3일 전에 안내한다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제10조 (출석 인정 기준)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                정기 모임 시작 시각까지 출석 체크를 완료한 경우 출석으로
                인정한다.
              </li>
              <li>
                정기 모임 시작 후 <strong>15분 이내</strong> 도착 시{" "}
                <strong>지각</strong>으로 처리한다.
              </li>
              <li>
                정기 모임 시작 후 <strong>15분 초과</strong> 도착 시{" "}
                <strong>결석</strong>으로 처리한다.
              </li>
              <li>
                정기 모임 전체 시간의 절반 이상 참여하지 않고 조기 퇴장할
                경우 <strong>조퇴</strong>로 처리하며, 지각 1회로 환산한다.
              </li>
              <li>
                <strong>지각 3회는 결석 1회</strong>로 환산한다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제11조 (공결 사유)
            </h3>
            <p className="mb-4">
              다음 각 호에 해당하는 경우 사전 신청을 통해 공결로 인정받을 수
              있다.
            </p>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>학교 공식 시험 기간(중간 · 기말고사 해당 주)</li>
              <li>질병 · 부상 (진단서 또는 소견서 제출)</li>
              <li>직계 가족 경조사</li>
              <li>학교 공식 행사 참여 (증빙 필요)</li>
              <li>취업 관련 면접 (증빙 필요)</li>
              <li>기타 운영진이 인정하는 불가피한 사유</li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제12조 (공결 신청 절차)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                공결 사유 발생 시 정기 모임 <strong>전일(24시간 전)</strong>
                까지 운영진에게 사유와 증빙을 제출하여야 한다.
              </li>
              <li>
                긴급한 사유(당일 발생한 질병 등)의 경우 모임 시작{" "}
                <strong>1시간 전</strong>까지 연락하고,{" "}
                <strong>3일 이내</strong>에 증빙을 제출한다.
              </li>
              <li>사전 연락 없는 불참은 무단 결석으로 처리한다.</li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제13조 (출석 관련 제재)
            </h3>
            <ul className="mb-8 list-decimal space-y-2 pl-8">
              <li>
                <strong>무단 결석 2회</strong> 누적 시 운영진이 해당 회원에게
                경고를 통보한다.
              </li>
              <li>
                <strong>무단 결석 3회 초과</strong> 시 운영진 내에서{" "}
                <strong>제명 심의 대상</strong>이 된다.
              </li>
              <li>
                전체 프로그램 기간 중 결석(공결 제외){" "}
                <strong>5회 이상</strong> 누적 시 수료가 인정되지 않을 수
                있다.
              </li>
            </ul>
          </section>

          {/* ==================== 제5장 과제 ==================== */}
          <section id="assignments" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제5장 과제
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제14조 (과제 수행 의무)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                회원은 운영진이 부여한 과제를 지정된 기한 내에 성실히
                수행하여야 한다.
              </li>
              <li>
                과제에는 개인 과제, 팀 프로젝트 산출물, 발표 자료 준비 등이
                포함된다.
              </li>
              <li>
                과제 제출 기한은 부여 시 명시하며, 특별한 사유 없이 기한을
                초과할 경우 미제출로 간주한다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제15조 (과제 불성실 이행에 대한 제재)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                과제를 <strong>2회 이상</strong> 미제출하거나 현저히 불성실하게
                수행한 경우, 운영진이 해당 회원과{" "}
                <strong>개인 면담</strong>을 진행한다.
              </li>
              <li>
                면담 이후에도 개선되지 않을 경우{" "}
                <strong>제명 심의 대상</strong>이 될 수 있다.
              </li>
              <li>
                팀 프로젝트에서 지속적으로 무임승차하여 팀원에게 피해를 주는
                행위는 과제 불성실 이행과 동일하게 처리한다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제16조 (과제 관련 공결 및 기한 연장)
            </h3>
            <ul className="mb-8 list-decimal space-y-2 pl-8">
              <li>
                질병, 가족 경조사 등 불가피한 사유가 있는 경우 기한 전에
                운영진에게 연장을 요청할 수 있다.
              </li>
              <li>
                연장 승인 여부는 운영진이 결정하며, 최대{" "}
                <strong>3일</strong>까지 연장할 수 있다.
              </li>
            </ul>
          </section>

          {/* ==================== 제6장 운영 ==================== */}
          <section id="operations" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제6장 운영
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제17조 (운영진 구성)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                학회의 운영은 프러너 및 관리자 권한을 가진 회원이 담당한다.
              </li>
              <li>
                운영진은 회원 관리, 프로그램 기획, 재정 관리, 징계 심의 등의
                권한을 가진다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제18조 (의사결정)
            </h3>
            <ul className="mb-8 list-decimal space-y-2 pl-8">
              <li>
                운영진 회의는 운영진 과반수 출석으로 개회하고, 출석 인원
                과반수 찬성으로 의결한다.
              </li>
              <li>
                회원 제명 등 중대한 사안은 운영진{" "}
                <strong>2/3 이상</strong> 찬성으로 의결한다.
              </li>
            </ul>
          </section>

          {/* ==================== 제7장 징계 및 제명 ==================== */}
          <section id="discipline" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제7장 징계 및 제명
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제19조 (징계 사유)
            </h3>
            <p className="mb-4">
              다음 각 호에 해당하는 경우 징계 대상이 된다.
            </p>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>무단 결석 3회 초과 누적</li>
              <li>
                과제 불성실 이행에 대한 개인 면담 이후에도 개선이 없는 경우
              </li>
              <li>
                학회 활동 중 타 회원에 대한 폭언 · 폭행 · 성희롱 등 부적절한
                행위
              </li>
              <li>학회의 명예를 현저히 훼손하는 행위</li>
              <li>회비 미납 후 독촉에도 불응하는 경우</li>
              <li>기타 회칙을 중대하게 위반하는 행위</li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제20조 (징계 절차)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>징계 사유가 발생하면 운영진 회의를 소집한다.</li>
              <li>
                해당 회원에게 <strong>소명 기회</strong>를 서면 또는 대면으로
                부여한다.
              </li>
              <li>
                소명을 검토한 후 운영진 투표로 징계 수위를 결정한다.
              </li>
              <li>
                징계 결과는 해당 회원에게 서면(메시지 포함)으로 통보한다.
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제21조 (징계 종류)
            </h3>
            <ul className="mb-6 list-decimal space-y-2 pl-8">
              <li>
                <strong>경고</strong> &mdash; 서면 통보, 누적 관리
              </li>
              <li>
                <strong>활동 제한</strong> &mdash; 일정 기간 특정 활동 참여
                제한
              </li>
              <li>
                <strong>제명</strong> &mdash; 회원 자격 박탈 (운영진 2/3
                이상 찬성 필요)
              </li>
            </ul>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제22조 (제명 시 회비)
            </h3>
            <p className="mb-8">
              제명된 회원의 회비는 환불하지 않는다.
            </p>
          </section>

          {/* ==================== 제8장 기타 ==================== */}
          <section id="etc" className="scroll-mt-24">
            <h2 className="mb-6 font-['MaruBuri',serif] text-2xl font-semibold">
              제8장 기타
            </h2>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제23조 (개인정보)
            </h3>
            <p className="mb-6">
              회원의 개인정보는 학회 운영 목적으로만 사용하며, 프로그램 종료
              후 1년 이내에 파기한다. 개인정보 처리에 관한 세부 사항은{" "}
              <a
                href="/legal#privacy"
                className="text-[#FF6C0F] hover:underline"
              >
                개인정보처리방침
              </a>
              을 따른다.
            </p>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제24조 (회칙 개정)
            </h3>
            <p className="mb-6">
              본 회칙의 개정은 운영진 회의에서 2/3 이상 찬성으로 의결하며,
              개정 즉시 전 회원에게 공지한다.
            </p>

            <h3 className="mb-3 font-['MaruBuri',serif] text-lg font-semibold">
              제25조 (시행일)
            </h3>
            <p className="mb-8">
              본 회칙은 2026년 3월 27일부터 시행한다.
            </p>
          </section>

          <section className="scroll-mt-24">
            <p className="text-sm text-[#16140f]/50">
              &copy; 2026 SPEC (성균관대학교 창업학회). All rights reserved.
            </p>
          </section>
        </article>
      </div>
    </section>
  );
}
