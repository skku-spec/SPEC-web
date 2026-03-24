"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  BookOpen,
  CalendarDays,
  Search,
  Check,
  X,
  AlertCircle,
  FolderOpen,
  Package,
  User,
  BarChart3,
  Palette,
  ChevronDown,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Settings,
} from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";

const SECTIONS = [
  "색상",
  "타이포그래피",
  "간격",
  "컴포넌트",
  "폼",
  "상태",
  "아이콘",
  "네비게이션",
  "레이아웃",
  "퍼블릭",
  "패턴",
] as const;

type Section = (typeof SECTIONS)[number];

function ColorSwatch({ hex, name, usage }: { hex: string; name: string; usage: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 rounded-lg border border-[#ece8db]" style={{ backgroundColor: hex }} />
      <div>
        <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{name}</p>
        <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
          {hex} — {usage}
        </p>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#16140f] p-4 font-mono text-xs leading-relaxed text-[#FCFCF8]">
      {children}
    </pre>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 border-b border-[#ece8db] pb-3 font-[system-ui] text-xl font-black text-[#16140f]">
      {children}
    </h2>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">{title}</h3>
      {children}
    </div>
  );
}

function Rule({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#ece8db] bg-[#fcfcf8] p-4">
      <p className="mb-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">{label}</p>
      <div className="font-['Pretendard',sans-serif] text-sm leading-relaxed text-[#4a4a40]">{children}</div>
    </div>
  );
}

export function DesignSystemClient() {
  const [activeSection, setActiveSection] = useState<Section>("색상");

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-2 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">
        Design System
      </h1>
      <p className="mb-8 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
        SPEC 프로젝트의 디자인 토큰, 컴포넌트, 레이아웃 규칙을 정의합니다. 모든 페이지는 이 문서의 규칙을 따릅니다.
      </p>

      <div className="mb-8 flex flex-wrap gap-1.5">
        {SECTIONS.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`rounded-md px-3 py-1.5 font-['Pretendard',sans-serif] text-xs font-semibold transition-colors ${
              activeSection === section
                ? "bg-[#16140f] text-white"
                : "text-[#6b6b5e] hover:bg-[#f0efe6]"
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {activeSection === "색상" && <ColorsSection />}
        {activeSection === "타이포그래피" && <TypographySection />}
        {activeSection === "간격" && <SpacingSection />}
        {activeSection === "컴포넌트" && <ComponentsSection />}
        {activeSection === "폼" && <FormsSection />}
        {activeSection === "상태" && <StatesSection />}
        {activeSection === "아이콘" && <IconsSection />}
        {activeSection === "네비게이션" && <NavigationSection />}
        {activeSection === "레이아웃" && <LayoutSection />}
        {activeSection === "퍼블릭" && <PublicSection />}
        {activeSection === "패턴" && <PatternsSection />}
      </div>
    </div>
  );
}

function ColorsSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>색상 팔레트</SectionTitle>

      <SubSection title="기본 색상">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorSwatch hex="#FF6C0F" name="Primary Orange" usage="CTA, 액센트, 활성 상태" />
          <ColorSwatch hex="#16140f" name="Dark" usage="제목, 본문 텍스트, 주요 버튼" />
          <ColorSwatch hex="#FCFCF8" name="Light" usage="다크 테마 텍스트" />
          <ColorSwatch hex="#f5f5ee" name="Background" usage="페이지 배경 (크림)" />
          <ColorSwatch hex="#fcfcf8" name="Surface" usage="호버 배경, 카드 대체" />
        </div>
      </SubSection>

      <SubSection title="텍스트 색상">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorSwatch hex="#16140f" name="text-primary" usage="제목, 이름, 주요 정보" />
          <ColorSwatch hex="#4a4a40" name="text-secondary" usage="테이블 셀 값" />
          <ColorSwatch hex="#6b6b5e" name="text-tertiary" usage="부제, 보조 텍스트" />
        </div>
      </SubSection>

      <SubSection title="테두리 & 구분선">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorSwatch hex="#ddd9cc" name="border-default" usage="카드, 인풋, 테이블 외곽" />
          <ColorSwatch hex="#ece8db" name="border-row" usage="테이블 행 구분선" />
          <ColorSwatch hex="#f0efe6" name="border-light" usage="테이블 헤더 배경, 내부 구분" />
          <ColorSwatch hex="#e8e6dc" name="avatar-bg" usage="아바타 배경" />
        </div>
      </SubSection>

      <SubSection title="상태 색상">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorSwatch hex="#2f9e44" name="Success" usage="합격, 토글 On, 출석" />
          <ColorSwatch hex="#2563EB" name="Info" usage="심사중, 과제, 멤버 역할" />
          <ColorSwatch hex="#b42318" name="Error" usage="불합격, 삭제" />
          <ColorSwatch hex="#7C3AED" name="Purple" usage="프러너 역할, 팀과제" />
          <ColorSwatch hex="#0F766E" name="Teal" usage="러너 역할" />
        </div>
      </SubSection>

      <SubSection title="배지 배경 색상">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ColorSwatch hex="#FFF0E5" name="orange-light" usage="접수완료 배지, 활성 네비게이션" />
          <ColorSwatch hex="#E8F0FE" name="blue-light" usage="심사중 배지" />
          <ColorSwatch hex="#E6F9E6" name="green-light" usage="합격 배지" />
          <ColorSwatch hex="#FEE2E2" name="red-light" usage="불합격 배지" />
        </div>
      </SubSection>

      <Rule label="규칙">
        <ul className="list-inside list-disc space-y-1">
          <li>새로운 색상을 추가하지 않습니다. 위 팔레트 내에서만 사용합니다.</li>
          <li>투명도가 필요한 경우 Tailwind 슬래시 표기법을 사용합니다: <code className="rounded bg-[#f0efe6] px-1 text-xs">text-[#16140f]/60</code></li>
          <li>인라인 style의 color/backgroundColor 사용은 동적 값(역할별 색상 등)에만 허용됩니다.</li>
        </ul>
      </Rule>
    </div>
  );
}

function TypographySection() {
  return (
    <div className="space-y-8">
      <SectionTitle>타이포그래피</SectionTitle>

      <SubSection title="폰트 패밀리">
        <div className="space-y-4">
          <div className="rounded-lg border border-[#ece8db] p-4">
            <p className="font-['Pretendard',sans-serif] text-lg font-semibold text-[#16140f]">Pretendard</p>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              주요 UI 폰트. 모든 본문, 레이블, 버튼에 사용. <code className="rounded bg-[#f0efe6] px-1">font-[&apos;Pretendard&apos;,sans-serif]</code>
            </p>
          </div>
          <div className="rounded-lg border border-[#ece8db] p-4">
            <p className="font-[system-ui] text-lg font-black text-[#16140f]">System UI</p>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              페이지 제목 전용. <code className="rounded bg-[#f0efe6] px-1">font-[system-ui]</code>
            </p>
          </div>
          <div className="rounded-lg border border-[#ece8db] p-4">
            <p className="font-['MaruBuri',serif] text-lg text-[#16140f]">MaruBuri</p>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
              퍼블릭 페이지 한국어 세리프 악센트용. 관리자 페이지에서는 사용하지 않음.
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection title="제목 계층">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div>
            <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">H1 — 페이지 제목</p>
            <p className="font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">Page Title</p>
            <p className="mt-1 font-mono text-[10px] text-[#6b6b5e]">font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black</p>
          </div>
          <hr className="border-[#ece8db]" />
          <div>
            <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">테이블 헤더</p>
            <p className="bg-[#f0efe6] rounded px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">Table Header</p>
            <p className="mt-1 font-mono text-[10px] text-[#6b6b5e]">font-[&apos;Pretendard&apos;,sans-serif] text-sm font-semibold</p>
          </div>
          <hr className="border-[#ece8db]" />
          <div>
            <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">본문 — 이름, 주요 값</p>
            <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">Body Semibold</p>
            <p className="mt-1 font-mono text-[10px] text-[#6b6b5e]">font-[&apos;Pretendard&apos;,sans-serif] text-sm font-semibold text-[#16140f]</p>
          </div>
          <hr className="border-[#ece8db]" />
          <div>
            <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">본문 — 셀 값</p>
            <p className="font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">Body Regular</p>
            <p className="mt-1 font-mono text-[10px] text-[#6b6b5e]">font-[&apos;Pretendard&apos;,sans-serif] text-sm text-[#4a4a40]</p>
          </div>
          <hr className="border-[#ece8db]" />
          <div>
            <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">보조 — 부제, 날짜, 슬러그</p>
            <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">Caption</p>
            <p className="mt-1 font-mono text-[10px] text-[#6b6b5e]">font-[&apos;Pretendard&apos;,sans-serif] text-xs text-[#6b6b5e]</p>
          </div>
        </div>
      </SubSection>

      <Rule label="규칙">
        <ul className="list-inside list-disc space-y-1">
          <li>관리자 페이지에서 <code className="rounded bg-[#f0efe6] px-1 text-xs">font-black</code>은 페이지 제목(H1)에만 사용합니다.</li>
          <li>테이블 헤더와 이름 등 강조 텍스트에는 <code className="rounded bg-[#f0efe6] px-1 text-xs">font-semibold</code>를 사용합니다.</li>
          <li>모든 UI 텍스트에 <code className="rounded bg-[#f0efe6] px-1 text-xs">font-[&apos;Pretendard&apos;,sans-serif]</code>를 인라인으로 선언합니다.</li>
          <li>이모지 사용 금지. 아이콘이 필요하면 <code className="rounded bg-[#f0efe6] px-1 text-xs">lucide-react</code>를 사용합니다.</li>
        </ul>
      </Rule>
    </div>
  );
}

function SpacingSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>간격 & 크기</SectionTitle>

      <SubSection title="테이블 셀 패딩">
        <CodeBlock>{`헤더 셀:  px-4 py-3
바디 셀:  px-4 py-3
검색 인풋: py-2.5 pl-10 pr-4`}</CodeBlock>
      </SubSection>

      <SubSection title="컨테이너 패딩">
        <CodeBlock>{`카드/폼 내부:  p-5 또는 p-6
페이지 wrapper: px-5 py-6 sm:px-8 sm:py-10 lg:px-10
인풋 내부:     px-4 py-2.5
버튼 내부:     px-3 (h-8) 또는 px-4 (h-10)`}</CodeBlock>
      </SubSection>

      <SubSection title="간격 (gap / space)">
        <CodeBlock>{`페이지 섹션 간: space-y-4 또는 mb-6
제목과 콘텐츠:  mb-4 또는 mb-6
인라인 요소:   gap-2 또는 gap-3
테이블 뱃지:   gap-2`}</CodeBlock>
      </SubSection>

      <SubSection title="Border Radius">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { name: "rounded-md", px: "6px", usage: "버튼, 출석 셀" },
            { name: "rounded-lg", px: "8px", usage: "테이블, 인풋, 카드" },
            { name: "rounded-full", px: "9999px", usage: "아바타, 뱃지" },
          ].map((item) => (
            <div key={item.name} className="rounded-lg border border-[#ece8db] p-3 text-center">
              <div
                className={`mx-auto mb-2 h-12 w-12 border-2 border-[#16140f] ${item.name}`}
              />
              <p className="font-mono text-[10px] text-[#16140f]">{item.name}</p>
              <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">{item.px}</p>
              <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">{item.usage}</p>
            </div>
          ))}
        </div>
      </SubSection>

      <Rule label="규칙">
        <ul className="list-inside list-disc space-y-1">
          <li><code className="rounded bg-[#f0efe6] px-1 text-xs">rounded-[32px]</code>, <code className="rounded bg-[#f0efe6] px-1 text-xs">rounded-[40px]</code> 등 임의 큰 값은 사용하지 않습니다.</li>
          <li>테이블/카드 컨테이너는 항상 <code className="rounded bg-[#f0efe6] px-1 text-xs">rounded-lg</code>를 사용합니다.</li>
          <li>셀 패딩은 <code className="rounded bg-[#f0efe6] px-1 text-xs">px-4 py-3</code>으로 통일합니다.</li>
          <li><code className="rounded bg-[#f0efe6] px-1 text-xs">px-10</code> 등 과도한 패딩은 사용하지 않습니다.</li>
        </ul>
      </Rule>
    </div>
  );
}

function ComponentsSection() {
  const [selectValue, setSelectValue] = useState("runner");

  return (
    <div className="space-y-8">
      <SectionTitle>컴포넌트</SectionTitle>

      <SubSection title="버튼">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex h-8 items-center rounded-md bg-[#16140f] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
              Primary
            </button>
            <button className="inline-flex h-8 items-center rounded-md border border-[#ddd9cc] px-3 font-['Pretendard',sans-serif] text-xs font-medium text-[#16140f]">
              Secondary
            </button>
            <button className="inline-flex h-8 min-w-16 items-center justify-center rounded-md bg-[#2f9e44] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
              On
            </button>
            <button className="inline-flex h-8 min-w-16 items-center justify-center rounded-md bg-[#6b6b5e] px-3 font-['Pretendard',sans-serif] text-xs font-semibold text-white">
              Off
            </button>
            <button className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318] underline-offset-2 hover:underline">
              Delete
            </button>
          </div>
          <CodeBlock>{`Primary:   h-8 rounded-md bg-[#16140f] px-3 text-xs font-semibold text-white
Secondary: h-8 rounded-md border border-[#ddd9cc] px-3 text-xs font-medium text-[#16140f]
Toggle On:  h-8 min-w-16 rounded-md bg-[#2f9e44] text-xs font-semibold text-white
Toggle Off: h-8 min-w-16 rounded-md bg-[#6b6b5e] text-xs font-semibold text-white
Delete:    text-sm font-semibold text-[#b42318] hover:underline`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="인풋">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <input
            type="text"
            placeholder="검색어를 입력하세요..."
            className="w-full max-w-sm rounded-lg border border-[#ddd9cc] bg-white py-2.5 pl-4 pr-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
          />
          <CodeBlock>{`rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4
font-['Pretendard',sans-serif] text-sm text-[#16140f]
placeholder:text-[#16140f]/40
focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="셀렉트 (CustomSelect)">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="w-[160px]">
            <CustomSelect
              value={selectValue}
              onChange={setSelectValue}
              options={[
                { value: "admin", label: "관리자" },
                { value: "member", label: "부원" },
                { value: "preneur", label: "프러너" },
                { value: "runner", label: "러너" },
              ]}
            />
          </div>
          <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">
            <code className="rounded bg-[#f0efe6] px-1">components/ui/CustomSelect.tsx</code> 사용. 키보드 접근성 지원.
          </p>
        </div>
      </SubSection>

      <SubSection title="배지 (Badge)">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-[#FFF0E5] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#FF6C0F]">접수완료</span>
            <span className="inline-flex rounded-full bg-[#E8F0FE] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2563EB]">심사중</span>
            <span className="inline-flex rounded-full bg-[#E6F9E6] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#2f9e44]">합격</span>
            <span className="inline-flex rounded-full bg-[#FEE2E2] px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-[#b42318]">불합격</span>
            <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white" style={{ backgroundColor: "#DC2626" }}>관리자</span>
            <span className="inline-flex rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold text-white" style={{ backgroundColor: "#0F766E" }}>러너</span>
          </div>
          <CodeBlock>{`rounded-full px-2.5 py-1 font-['Pretendard',sans-serif] text-xs font-semibold

상태 배지:  bg-[색상-light] text-[색상]
역할 배지:  text-white style={{ backgroundColor: ROLE_COLORS[role] }}`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="아바타">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
              홍
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc] font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]">
              K
            </div>
          </div>
          <CodeBlock>{`grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc]
font-['Pretendard',sans-serif] text-sm font-semibold text-[#4a4a40]`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="테이블">
        <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#f0efe6] text-left">
              <tr>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">이름</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">역할</th>
                <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">기수</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#ece8db]">
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">홍길동</td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">러너</td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">1기</td>
              </tr>
              <tr className="border-t border-[#ece8db]">
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">김철수</td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">프러너</td>
                <td className="px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]">2기</td>
              </tr>
            </tbody>
          </table>
        </div>
        <CodeBlock>{`컨테이너: overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white
thead:    bg-[#f0efe6] text-left
th:       px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold
tr:       border-t border-[#ece8db]
td:       px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#4a4a40]
td(이름):  + font-semibold text-[#16140f]`}</CodeBlock>
      </SubSection>
    </div>
  );
}

function LayoutSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>레이아웃 규칙</SectionTitle>

      <SubSection title="관리자 페이지 구조">
        <CodeBlock>{`<AdminLayout>                              ← min-h-screen bg-[#f5f5ee]
  <aside>                                  ← w-[240px], 데스크톱만 표시
    <AdminSidebar />                       ← sticky top-[100px], rounded-lg border bg-white p-5
  </aside>
  <main>                                   ← px-5 py-6 sm:px-8 sm:py-10 lg:px-10
    <h1>Page Title</h1>                    ← font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black
    <p>subtitle</p>                        ← font-['Pretendard'] text-xs text-[#6b6b5e] sm:text-sm
    <div>content...</div>                  ← rounded-lg border border-[#ddd9cc] bg-white
  </main>
</AdminLayout>`}</CodeBlock>
      </SubSection>

      <SubSection title="페이지 헤더 패턴">
        <Rule label="필수">
          모든 관리자 페이지는 동일한 헤더 패턴을 따릅니다:
          <CodeBlock>{`<h1 className="mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black">
  Page Title
</h1>
<p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e] sm:text-sm">
  부제/설명
</p>`}</CodeBlock>
        </Rule>
      </SubSection>

      <SubSection title="콘텐츠 너비">
        <div className="space-y-3">
          <Rule label="관리자 페이지">
            <code className="rounded bg-[#f0efe6] px-1 text-xs">mx-auto max-w-6xl</code> — 모든 관리자 페이지 콘텐츠
          </Rule>
          <Rule label="퍼블릭 페이지">
            <ul className="list-inside list-disc space-y-1">
              <li><code className="rounded bg-[#f0efe6] px-1 text-xs">max-w-[960px]</code> — 일반 콘텐츠 섹션</li>
              <li><code className="rounded bg-[#f0efe6] px-1 text-xs">max-w-[1100px]</code> — 목록/디렉토리 페이지</li>
              <li><code className="rounded bg-[#f0efe6] px-1 text-xs">max-w-[720px]</code> — 아티클 본문</li>
            </ul>
          </Rule>
        </div>
      </SubSection>

      <SubSection title="반응형 규칙">
        <Rule label="브레이크포인트">
          <ul className="list-inside list-disc space-y-1">
            <li><code className="rounded bg-[#f0efe6] px-1 text-xs">lg:</code> (1024px) — 사이드바 표시/숨김 기준</li>
            <li><code className="rounded bg-[#f0efe6] px-1 text-xs">sm:</code> (640px) — 패딩/폰트 크기 조정</li>
            <li>모바일 우선 접근법: 기본값이 모바일, <code className="rounded bg-[#f0efe6] px-1 text-xs">sm:</code>/<code className="rounded bg-[#f0efe6] px-1 text-xs">lg:</code>로 확장</li>
          </ul>
        </Rule>
      </SubSection>
    </div>
  );
}

function PatternsSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>금지 패턴 & 권장 패턴</SectionTitle>

      <SubSection title="금지 사항">
        <div className="space-y-3">
          {[
            { bad: "이모지 (📊 👥 ✅ 등)", why: "플랫폼별 렌더링 불일치. lucide-react 아이콘 사용" },
            { bad: "rounded-[32px], rounded-[40px], rounded-3xl", why: "rounded-lg (8px)로 통일" },
            { bad: "px-10, py-8 등 과도한 패딩", why: "px-4 py-3 기준으로 통일" },
            { bad: "text-[10px] font-black uppercase tracking-widest", why: "text-sm font-semibold로 통일" },
            { bad: "border-[#d9d9cc] (9가 아닌 d)", why: "border-[#ddd9cc]로 통일" },
            { bad: "shadow-lg, shadow-xl (테이블/카드에)", why: "shadow 없이 border만 사용" },
            { bad: "hover:scale-105, hover:-translate-y-1", why: "hover:bg-[#fcfcf8] 등 색상 변화만 사용" },
            { bad: "rounded-full + shadow 조합의 FAB 버튼", why: "rounded-md h-8 직사각형 버튼 사용" },
            { bad: "font-black (제목 외)", why: "제목만 font-black, 나머지 font-semibold" },
            { bad: "divide-y divide-[#f0efe6]", why: "border-t border-[#ece8db]로 행 구분" },
          ].map((item) => (
            <div key={item.bad} className="flex gap-3 rounded-lg border border-[#ece8db] bg-white p-3">
              <span className="mt-0.5 shrink-0 font-['Pretendard',sans-serif] text-sm font-semibold text-[#b42318]">✕</span>
              <div>
                <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{item.bad}</p>
                <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{item.why}</p>
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="권장 패턴">
        <div className="space-y-3">
          {[
            { good: "모든 인풋에 font-['Pretendard',sans-serif] 인라인 선언", why: "폰트 일관성 보장" },
            { good: "테이블 컨테이너: rounded-lg border border-[#ddd9cc] bg-white", why: "모든 테이블에 동일 적용" },
            { good: "빈 상태: border-t border-[#ece8db] 행 안에 colSpan + text-center", why: "별도 컨테이너 대신 테이블 내부" },
            { good: "역할/상태별 색상은 Record<Type, string> 상수로 관리", why: "인라인 조건 최소화" },
            { good: "disabled 상태: disabled:cursor-not-allowed disabled:opacity-60", why: "모든 비활성 버튼에 동일" },
          ].map((item) => (
            <div key={item.good} className="flex gap-3 rounded-lg border border-[#ece8db] bg-white p-3">
              <span className="mt-0.5 shrink-0 font-['Pretendard',sans-serif] text-sm font-semibold text-[#2f9e44]">✓</span>
              <div>
                <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">{item.good}</p>
                <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">{item.why}</p>
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="새 페이지 체크리스트">
        <Rule label="관리자 페이지를 새로 만들 때">
          <ol className="list-inside list-decimal space-y-1">
            <li>페이지 wrapper: <code className="rounded bg-[#f0efe6] px-1 text-xs">mx-auto max-w-6xl</code></li>
            <li>H1: <code className="rounded bg-[#f0efe6] px-1 text-xs">mb-6 font-[system-ui] text-[clamp(2rem,4vw,2.75rem)] font-black</code></li>
            <li>테이블: <code className="rounded bg-[#f0efe6] px-1 text-xs">rounded-lg border border-[#ddd9cc] bg-white</code></li>
            <li>thead: <code className="rounded bg-[#f0efe6] px-1 text-xs">bg-[#f0efe6] text-left</code></li>
            <li>th: <code className="rounded bg-[#f0efe6] px-1 text-xs">px-4 py-3 font-[&apos;Pretendard&apos;,sans-serif] text-sm font-semibold</code></li>
            <li>tr: <code className="rounded bg-[#f0efe6] px-1 text-xs">border-t border-[#ece8db]</code></li>
            <li>td: <code className="rounded bg-[#f0efe6] px-1 text-xs">px-4 py-3 font-[&apos;Pretendard&apos;,sans-serif] text-sm</code></li>
            <li>아바타: <code className="rounded bg-[#f0efe6] px-1 text-xs">grid h-9 w-9 place-items-center rounded-full bg-[#e8e6dc]</code></li>
            <li>버튼: <code className="rounded bg-[#f0efe6] px-1 text-xs">h-8 rounded-md</code> 기준</li>
            <li>빈 상태: 테이블 내부 <code className="rounded bg-[#f0efe6] px-1 text-xs">colSpan + py-8 text-center text-sm text-[#6b6b5e]</code></li>
          </ol>
        </Rule>
      </SubSection>
    </div>
  );
}

function FormsSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>폼 패턴</SectionTitle>

      <SubSection title="텍스트 인풋">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="space-y-3 max-w-md">
            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">레이블</label>
              <input
                type="text"
                placeholder="값을 입력하세요"
                className="w-full rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">비활성</label>
              <input
                type="text"
                disabled
                value="수정 불가"
                className="w-full rounded-lg border border-[#ddd9cc] bg-[#f0efe6] py-2.5 px-4 font-['Pretendard',sans-serif] text-sm text-[#6b6b5e] outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <CodeBlock>{`레이블:   mb-1.5 block text-sm font-semibold text-[#16140f]
인풋:    rounded-lg border border-[#ddd9cc] bg-white py-2.5 px-4
         text-sm text-[#16140f] placeholder:text-[#16140f]/40
         focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10
비활성:   bg-[#f0efe6] text-[#6b6b5e] cursor-not-allowed`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="텍스트에어리어">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <textarea
            rows={3}
            placeholder="내용을 입력하세요..."
            className="w-full max-w-md rounded-lg border border-[#ddd9cc] bg-white px-4 py-3 font-['Pretendard',sans-serif] text-sm text-[#16140f] outline-none transition-colors placeholder:text-[#16140f]/40 focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10 resize-none"
          />
          <CodeBlock>{`인풋과 동일한 border/focus 패턴 + resize-none
rows={3} 기본, 필요시 조정`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="폼 레이아웃">
        <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
          <CodeBlock>{`폼 컨테이너: rounded-lg border border-[#ddd9cc] bg-white p-6 space-y-8
섹션 제목:   text-xs font-semibold uppercase tracking-widest text-[#6b6b5e]
             border-b border-[#ece8db] pb-2
필드 간격:   space-y-4
버튼 영역:   flex justify-end gap-2 pt-6 border-t border-[#ece8db]
취소 버튼:   h-8 rounded-md text-xs font-semibold text-[#6b6b5e] hover:bg-[#f0efe6]
제출 버튼:   h-8 rounded-md bg-[#16140f] text-xs font-semibold text-white`}</CodeBlock>
        </div>
      </SubSection>

      <Rule label="규칙">
        <ul className="list-inside list-disc space-y-1">
          <li>모든 인풋에 <code className="rounded bg-[#f0efe6] px-1 text-xs">font-[&apos;Pretendard&apos;,sans-serif]</code> 인라인 선언 필수</li>
          <li>focus 상태는 항상 <code className="rounded bg-[#f0efe6] px-1 text-xs">focus:border-[#FF6C0F]/50 focus:ring-2 focus:ring-[#FF6C0F]/10</code></li>
          <li>레이블은 인풋 바로 위에 <code className="rounded bg-[#f0efe6] px-1 text-xs">mb-1.5</code> 간격으로 배치</li>
          <li>폼 내 섹션 구분은 <code className="rounded bg-[#f0efe6] px-1 text-xs">border-b border-[#ece8db]</code></li>
        </ul>
      </Rule>
    </div>
  );
}

function StatesSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>로딩 / 빈 상태 / 모달</SectionTitle>

      <SubSection title="로딩 스피너">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <svg className="h-8 w-8 animate-spin text-[#FF6C0F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">기본 (h-8 w-8)</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <svg className="h-5 w-5 animate-spin text-[#FF6C0F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">인라인 (h-5 w-5)</p>
            </div>
          </div>
          <CodeBlock>{`SVG 스피너: animate-spin text-[#FF6C0F]
전체 화면:  h-8 w-8, py-32 중앙 정렬
인라인:     h-5 w-5, 버튼/텍스트 옆에 배치`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="빈 상태 (Empty State)">
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-[#ddd9cc] bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-[#f0efe6] text-left">
                <tr>
                  <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">이름</th>
                  <th className="px-4 py-3 font-['Pretendard',sans-serif] text-sm font-semibold">역할</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#ece8db]">
                  <td colSpan={2} className="px-4 py-8 text-center font-['Pretendard',sans-serif] text-sm text-[#6b6b5e]">
                    등록된 데이터가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock>{`테이블 내부 빈 상태:
<tr className="border-t border-[#ece8db]">
  <td colSpan={N} className="px-4 py-8 text-center text-sm text-[#6b6b5e]">
    메시지
  </td>
</tr>`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="로딩 오버레이 (전체 화면)">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="relative h-32 rounded-lg bg-[#f0efe6] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-lg bg-white px-8 py-6 shadow-xl">
                <svg className="h-6 w-6 animate-spin text-[#FF6C0F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="font-['Pretendard',sans-serif] text-xs font-semibold text-[#16140f]">처리 중...</p>
              </div>
            </div>
          </div>
          <CodeBlock>{`오버레이:  fixed inset-0 z-50 flex items-center justify-center
           bg-black/40 backdrop-blur-sm
모달 박스: rounded-xl bg-white px-10 py-8 shadow-xl
스피너:    h-8 w-8 animate-spin text-[#FF6C0F]
텍스트:    text-sm font-semibold text-[#16140f]`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="삭제 확인">
        <Rule label="패턴">
          <code className="rounded bg-[#f0efe6] px-1 text-xs">window.confirm()</code> 사용. 커스텀 모달 대신 브라우저 네이티브 다이얼로그를 사용합니다.
          <CodeBlock>{`const handleDelete = (id: string) => {
  if (!window.confirm("삭제하시겠습니까?")) return;
  // 삭제 로직
};`}</CodeBlock>
        </Rule>
      </SubSection>
    </div>
  );
}

function IconsSection() {
  const icons = [
    { component: LayoutDashboard, name: "LayoutDashboard", usage: "대시보드 네비" },
    { component: Users, name: "Users", usage: "멤버/팀 네비" },
    { component: ClipboardList, name: "ClipboardList", usage: "지원서 네비, 과제 내용 탭" },
    { component: FileText, name: "FileText", usage: "게시물 네비" },
    { component: BookOpen, name: "BookOpen", usage: "과제 네비, 과제 카드 아이콘" },
    { component: CalendarDays, name: "CalendarDays", usage: "출석 네비" },
    { component: Search, name: "Search", usage: "검색 인풋 아이콘" },
    { component: Check, name: "Check", usage: "완료 상태 표시" },
    { component: X, name: "X", usage: "미완료 상태, 닫기" },
    { component: AlertCircle, name: "AlertCircle", usage: "경고/에러 상태" },
    { component: FolderOpen, name: "FolderOpen", usage: "빈 폴더 상태" },
    { component: Package, name: "Package", usage: "빈 데이터 상태" },
    { component: User, name: "User", usage: "개인 과제 표시" },
    { component: BarChart3, name: "BarChart3", usage: "제출 현황 탭" },
    { component: ChevronDown, name: "ChevronDown", usage: "드롭다운 화살표" },
    { component: Plus, name: "Plus", usage: "추가 버튼 (텍스트와 함께)" },
    { component: Trash2, name: "Trash2", usage: "삭제 (필요시)" },
    { component: ExternalLink, name: "ExternalLink", usage: "외부 링크" },
    { component: Eye, name: "Eye", usage: "미리보기/열람" },
    { component: Settings, name: "Settings", usage: "설정" },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle>아이콘 (lucide-react)</SectionTitle>

      <SubSection title="사용 중인 아이콘">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {icons.map(({ component: Icon, name, usage }) => (
            <div key={name} className="flex items-center gap-3 rounded-lg border border-[#ece8db] bg-white p-3">
              <Icon className="h-5 w-5 shrink-0 text-[#4a4a40]" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] text-[#16140f]">{name}</p>
                <p className="truncate font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e]">{usage}</p>
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="크기 규격">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-end gap-6">
            {[
              { size: "h-3.5 w-3.5", label: "모바일 네비", sw: 2 },
              { size: "h-4 w-4", label: "인라인/검색", sw: 2 },
              { size: "h-[18px] w-[18px]", label: "데스크톱 네비", sw: 2 },
              { size: "h-5 w-5", label: "카드 아이콘", sw: 1.5 },
              { size: "h-8 w-8", label: "빈 상태", sw: 1.5 },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <BookOpen className={`${item.size} text-[#4a4a40]`} strokeWidth={item.sw} />
                <p className="font-['Pretendard',sans-serif] text-[10px] text-[#6b6b5e] text-center">{item.label}</p>
                <p className="font-mono text-[9px] text-[#6b6b5e]">{item.size}</p>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      <Rule label="규칙">
        <ul className="list-inside list-disc space-y-1">
          <li><code className="rounded bg-[#f0efe6] px-1 text-xs">lucide-react</code>만 사용. 다른 아이콘 라이브러리 금지.</li>
          <li>네비게이션 활성 상태: <code className="rounded bg-[#f0efe6] px-1 text-xs">strokeWidth={'{'}2.5{'}'}</code>, 비활성: <code className="rounded bg-[#f0efe6] px-1 text-xs">strokeWidth={'{'}2{'}'}</code></li>
          <li>카드/빈 상태 아이콘: <code className="rounded bg-[#f0efe6] px-1 text-xs">strokeWidth={'{'}1.5{'}'}</code></li>
          <li>아이콘 단독 사용 금지. 항상 텍스트 레이블과 함께 배치합니다.</li>
          <li>이모지(📊👥✅ 등)는 어떤 경우에도 사용하지 않습니다.</li>
        </ul>
      </Rule>
    </div>
  );
}

function NavigationSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>네비게이션</SectionTitle>

      <SubSection title="데스크톱 사이드바">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="w-[220px] space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-[#FFF0E5] px-3 py-2.5 text-sm font-semibold text-[#FF6C0F]">
              <LayoutDashboard className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
              <span>대시보드</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a40] hover:bg-[#f0efe6]">
              <Users className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>멤버</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#4a4a40] hover:bg-[#f0efe6]">
              <ClipboardList className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>지원서</span>
            </div>
          </div>
          <CodeBlock>{`활성:   rounded-lg px-3 py-2.5 bg-[#FFF0E5] font-semibold text-[#FF6C0F]
        아이콘 strokeWidth={2.5}
비활성: rounded-lg px-3 py-2.5 text-[#4a4a40] hover:bg-[#f0efe6]
        아이콘 strokeWidth={2}
아이콘: h-[18px] w-[18px] shrink-0
간격:   gap-3, space-y-1`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="모바일 네비게이션">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#FFF0E5] px-2.5 py-1 text-xs font-medium text-[#FF6C0F]">
              <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Dashboard</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40]">
              <Users className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Users</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40]">
              <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Applications</span>
            </div>
          </div>
          <CodeBlock>{`활성:   rounded-md px-2.5 py-1 bg-[#FFF0E5] text-xs font-medium text-[#FF6C0F]
비활성: rounded-md px-2.5 py-1 text-xs font-medium text-[#4a4a40]
        hover:bg-[#f0efe6]
아이콘: h-3.5 w-3.5
간격:   gap-1.5
컨테이너: overflow-x-auto (가로 스크롤)`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="사이드바 컨테이너">
        <CodeBlock>{`외곽:   sticky top-[100px] rounded-lg border border-[#d9d9cc] bg-white p-5
        maxHeight: calc(100vh - 120px), overflow-y-auto
aside:  w-[240px] shrink-0, hidden lg:block
제목:   text-[11px] uppercase tracking-[0.18em] text-[#6b6b5e] (SPEC)
        text-sm font-semibold text-[#16140f] (관리자 센터)
구분선: mt-4 border-b border-[#f0efe6]`}</CodeBlock>
      </SubSection>
    </div>
  );
}

function PublicSection() {
  return (
    <div className="space-y-8">
      <SectionTitle>퍼블릭 페이지</SectionTitle>

      <SubSection title="PageHeader 컴포넌트">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="text-center">
            <h2 className="text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.15] tracking-tight uppercase text-[#16140f]">
              Page Title
            </h2>
            <p className="mt-3 font-['Pretendard',sans-serif] text-[17px] font-normal leading-[1.7] text-[#16140f]/60">
              이 컴포넌트는 퍼블릭 페이지의 제목에 사용됩니다.
            </p>
          </div>
          <CodeBlock>{`components/layout/PageHeader.tsx

Props: title, subtitle?, align? ("center" | "left"), dark?, className?, children?

제목: text-[clamp(2.5rem,5vw,3.75rem)] font-black leading-[1.15]
      tracking-tight uppercase text-[#16140f]
부제: mt-3 font-['Pretendard'] text-[17px] font-normal
      leading-[1.7] text-[#16140f]/60
간격: mb-10 md:mb-14 (하단 여백)`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="퍼블릭 페이지 섹션 간격">
        <CodeBlock>{`랜딩 섹션:     py-16 md:py-32
일반 섹션:     py-12 md:py-20
콘텐츠 wrapper: mx-auto max-w-[960px] px-6
넓은 wrapper:  mx-auto max-w-[1100px] px-6
섹션 간 간격:  mb-12
소제목 간격:   mb-3 또는 mb-10`}</CodeBlock>
      </SubSection>

      <SubSection title="퍼블릭 카드 패턴">
        <div className="space-y-4 rounded-lg border border-[#ddd9cc] bg-white p-6">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-[10px] border border-[#ddd9cc] bg-white p-4 shadow-sm">
              <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">폼 카드</p>
              <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">rounded-[10px]</p>
            </div>
            <div className="rounded-lg border border-[#ddd9cc] bg-white p-4 shadow-sm">
              <p className="font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">일반 카드</p>
              <p className="font-['Pretendard',sans-serif] text-xs text-[#6b6b5e]">rounded-lg</p>
            </div>
          </div>
          <CodeBlock>{`폼 카드:    rounded-[10px] border border-[#ddd9cc] bg-white p-8 shadow-sm space-y-7
일반 카드:  rounded-lg border border-[#ddd9cc] bg-white p-6
인물 카드:  rounded-xl px-3 py-6 hover:bg-[#eceadf] (LeadCard)
            rounded-lg px-2 py-3 hover:bg-[#eceadf] (PreneurCard)`}</CodeBlock>
        </div>
      </SubSection>

      <SubSection title="퍼블릭 타이포그래피">
        <CodeBlock>{`H1 (PageHeader):  text-[clamp(2.5rem,5vw,3.75rem)] font-black uppercase tracking-tight
H2 (섹션 제목):   text-2xl font-bold, uppercase tracking-[0.1em]
H3 (소제목):      text-sm font-semibold uppercase tracking-[0.1em] text-[#16140f]/50
본문 (Pretendard): text-[17px] font-normal leading-[1.7] text-[#16140f]/60
본문 (MaruBuri):   font-['MaruBuri',serif] text-base leading-relaxed text-white/70
CTA 버튼:         font-['Source_Serif_4',serif] font-semibold italic`}</CodeBlock>
      </SubSection>

      <SubSection title="Navbar">
        <CodeBlock>{`위치:       sticky top-0 isolate z-50
배경:       bg-transparent (홈) | bg-[#f5f5ee] (나머지)
네비 링크:  text-sm font-normal tracking-[0.4px] opacity transition
드롭다운:   rounded-lg border bg-white/white backdrop-blur-sm
유저 아바타: h-8 w-8 rounded-full bg-[#FF6C0F] text-xs font-semibold text-white
모바일 메뉴: fixed inset-0 z-50, 오른쪽 슬라이드 max-w-[380px]`}</CodeBlock>
      </SubSection>

      <SubSection title="Footer">
        <CodeBlock>{`배경:       bg-black/90 border-t border-white/10
컨테이너:   mx-auto max-w-6xl px-6 py-12
그리드:     grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-16
섹션 제목:  text-sm font-medium tracking-wider text-white
링크:       text-sm font-light text-white/60 hover:text-white`}</CodeBlock>
      </SubSection>
    </div>
  );
}
