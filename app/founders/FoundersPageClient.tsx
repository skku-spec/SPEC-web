"use client";

import { useState, useMemo, useCallback, Children } from "react";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import CustomSelect from "@/components/ui/CustomSelect";

export interface Member {
  id: string;
  name: string;
  slug: string;
  major: string | null;
  runnerBatch: string | null;
  preneurBatch: string | null;
  batchTags: string[];
  memberType: "러너" | "프러너" | "alumni";
  projects: string[];
  photoUrl: string | null;
  bio: string | null;
}

export interface ProjectOption {
  value: string;
  label: string;
}

interface FoundersPageClientProps {
  members: Member[];
  batchOptions: string[];
  memberTypeOptions: Array<Member["memberType"]>;
  projectOptions: ProjectOption[];
  isLoggedIn: boolean;
}

export default function FoundersPageClient({
  members: MEMBERS,
  batchOptions: BATCH_OPTIONS,
  memberTypeOptions: MEMBER_TYPE_OPTIONS,
  projectOptions: PROJECT_OPTIONS,
  isLoggedIn,
}: FoundersPageClientProps) {
  const PROJECT_LABEL_MAP: Record<string, string> = useMemo(() => Object.fromEntries(
    PROJECT_OPTIONS.map((p) => [p.value, p.label])
  ), [PROJECT_OPTIONS]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedMemberTypes, setSelectedMemberTypes] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const [batchExpanded, setBatchExpanded] = useState(true);
  const [memberTypeExpanded, setMemberTypeExpanded] = useState(true);
  const [projectExpanded, setProjectExpanded] = useState(true);

  const toggleItem = useCallback((arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }, []);

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          m.name.toLowerCase().includes(q) ||
          (m.major?.toLowerCase().includes(q) ?? false) ||
          m.batchTags.some((t) => t.toLowerCase().includes(q)) ||
          m.projects.some((p) => (PROJECT_LABEL_MAP[p] ?? p).toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedBatches.length > 0 && !m.batchTags.some((t) => selectedBatches.some((b) => t.startsWith(b)))) return false;
      if (selectedMemberTypes.length > 0 && !selectedMemberTypes.includes(m.memberType)) return false;
      if (selectedProjects.length > 0 && !m.projects.some((p) => selectedProjects.includes(p))) return false;

      return true;
    });
  }, [searchQuery, selectedBatches, selectedMemberTypes, selectedProjects, MEMBERS, PROJECT_LABEL_MAP]);

  const batchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MEMBERS) {
      for (const b of BATCH_OPTIONS) {
        if (m.batchTags.some((t) => t.startsWith(b))) {
          counts[b] = (counts[b] || 0) + 1;
        }
      }
    }
    return counts;
  }, [MEMBERS, BATCH_OPTIONS]);

  const memberTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MEMBERS) {
      counts[m.memberType] = (counts[m.memberType] || 0) + 1;
    }
    return counts;
  }, [MEMBERS]);

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MEMBERS) {
      for (const p of m.projects) {
        counts[p] = (counts[p] || 0) + 1;
      }
    }
    return counts;
  }, [MEMBERS]);

  const hasActiveFilters =
    selectedBatches.length > 0 || selectedMemberTypes.length > 0 || selectedProjects.length > 0;

  const clearFilters = () => {
    setSelectedBatches([]);
    setSelectedMemberTypes([]);
    setSelectedProjects([]);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen px-4 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10 text-center">
          <PageHeader title="Members" subtitle="SPEC 멤버 디렉토리입니다." align="center" className="mb-0 md:mb-0" />
          {!isLoggedIn && (
            <p className="mx-auto mt-6 font-['Pretendard',sans-serif] text-[15px] font-normal text-black/60">
              SPEC 알럼나이를 찾고 계신가요?{" "}
              <Link href="/login" className="underline text-[#FF6C0F] hover:text-[#e55c00]">
                로그인
              </Link>
              하여 확인하세요.
            </p>
          )}
        </div>

        {/* Mobile filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3 lg:hidden">
          <MobileFilterSelect
            value={selectedMemberTypes.length === 1 ? selectedMemberTypes[0] : ""}
            onChange={(v) => setSelectedMemberTypes(v ? [v] : [])}
            options={MEMBER_TYPE_OPTIONS}
            placeholder="구분"
          />
          <MobileFilterSelect
            value={selectedBatches.length === 1 ? selectedBatches[0] : ""}
            onChange={(v) => setSelectedBatches(v ? [v] : [])}
            options={BATCH_OPTIONS}
            placeholder="기수"
          />
          <MobileFilterSelect
            value={selectedProjects.length === 1 ? selectedProjects[0] : ""}
            onChange={(v) => setSelectedProjects(v ? [v] : [])}
            options={PROJECT_OPTIONS}
            placeholder="프로젝트"
          />
        </div>

        <div className="flex gap-5">
          {/* Sidebar */}
          <aside className="sticky top-[100px] hidden w-[300px] shrink-0 self-start lg:block">
            <div
              className="max-h-[calc(100vh-120px)] space-y-1 overflow-y-auto rounded-lg border border-[#d9d9cc] bg-white p-5"
            >
              {/* 구분 section */}
              <FilterSection title="구분" expanded={memberTypeExpanded} onToggle={() => setMemberTypeExpanded(!memberTypeExpanded)}>
                <FilterCheckbox
                  label="전체"
                  checked={selectedMemberTypes.length === 0}
                  onChange={() => setSelectedMemberTypes([])}
                  count={MEMBERS.length}
                />
                {MEMBER_TYPE_OPTIONS.map((type) => (
                  <FilterCheckbox
                    key={type}
                    label={type}
                    checked={selectedMemberTypes.includes(type)}
                    onChange={() => setSelectedMemberTypes(toggleItem(selectedMemberTypes, type))}
                    count={memberTypeCounts[type] || 0}
                  />
                ))}
              </FilterSection>

              <Divider />

              {/* 기수 section */}
              <FilterSection title="기수" expanded={batchExpanded} onToggle={() => setBatchExpanded(!batchExpanded)}>
                <FilterCheckbox
                  label="전체"
                  checked={selectedBatches.length === 0}
                  onChange={() => setSelectedBatches([])}
                  count={MEMBERS.length}
                />
                {BATCH_OPTIONS.map((batch) => (
                  <FilterCheckbox
                    key={batch}
                    label={batch}
                    checked={selectedBatches.includes(batch)}
                    onChange={() => setSelectedBatches(toggleItem(selectedBatches, batch))}
                    count={batchCounts[batch] || 0}
                  />
                ))}
              </FilterSection>

              <Divider />

              {/* 프로젝트 section */}
              <FilterSection title="프로젝트" expanded={projectExpanded} onToggle={() => setProjectExpanded(!projectExpanded)}>
                <FilterCheckbox
                  label="전체"
                  checked={selectedProjects.length === 0}
                  onChange={() => setSelectedProjects([])}
                  count={MEMBERS.length}
                />
                {PROJECT_OPTIONS.map((proj) => (
                  <FilterCheckbox
                    key={proj.value}
                    label={proj.label}
                    checked={selectedProjects.includes(proj.value)}
                    onChange={() => setSelectedProjects(toggleItem(selectedProjects, proj.value))}
                    count={projectCounts[proj.value] || 0}
                  />
                ))}
              </FilterSection>

              {hasActiveFilters && (
                <>
                  <Divider />
                  <button
                    onClick={clearFilters}
                    className="w-full rounded-lg border border-black/10 bg-black/3 py-2 font-['Pretendard',sans-serif] text-[13px] font-medium text-black/60 transition-all hover:bg-black/5 hover:text-black"
                  >
                    필터 초기화
                  </button>
                </>
              )}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {/* Search bar */}
            <div className="mb-4">
              <div className="rounded-lg border border-[#d9d9cc] bg-white p-5">
                <input
                  type="text"
                  placeholder="멤버 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-[42px] w-full rounded-lg border border-[#d9d9cc] bg-white px-2.5 py-2.5 font-['Pretendard',sans-serif] text-base text-black outline-none placeholder:text-black/30 focus:border-[#999] focus:ring-0"
                />
              </div>
              <p className="mt-2 px-1 font-['Pretendard',sans-serif] text-[13px] font-normal text-black/50">
                Showing {filtered.length}명 of {MEMBERS.length}+명 멤버
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d9d9cc] py-20">
                <svg
                  className="mb-4 h-12 w-12 text-black/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
                <p className="font-['Pretendard',sans-serif] text-[15px] font-normal text-black/50">
                  검색 결과가 없습니다.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[#d9d9cc]">
                {filtered.map((member, index) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    projectLabelMap={PROJECT_LABEL_MAP}
                    isFirst={index === 0}
                    isLast={index === filtered.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Member Row (unchanged) ─────────── */

function MemberRow({
  member,
  projectLabelMap,
  isFirst,
  isLast,
}: {
  member: Member;
  projectLabelMap: Record<string, string>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const roundingClass = isFirst && isLast
    ? "rounded-lg"
    : isFirst
      ? "rounded-t-lg"
      : isLast
        ? "rounded-b-lg"
        : "";

  return (
    <div
      className={`flex items-center gap-4 bg-white px-5 py-4 ${!isLast ? "border-b border-[#d9d9cc]" : ""} ${roundingClass}`}
    >
      <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-full bg-[#efefe8]">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.name}
            fill
            className="object-cover"
            sizes="78px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-['Pretendard',sans-serif] text-[18px] font-bold text-[#8a8575]">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-['Pretendard',sans-serif] text-[18px] font-semibold text-black">
            {member.name}
          </span>
          <span className="font-['Pretendard',sans-serif] text-[14px] font-normal text-black/50">
            {member.major ?? "전공 미정"}
          </span>
          <MemberTypeBadge type={member.memberType} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {member.batchTags.map((tag) => (
            <span key={tag} className="rounded bg-[#e6e6dd] px-2 py-0.5 font-['Pretendard',sans-serif] text-[10px] font-medium text-[#333]">
              {tag}
            </span>
          ))}
          {member.projects.length > 0 && (
            <>
              <span className="mx-1 text-black/20">·</span>
              <span className="font-['Pretendard',sans-serif] text-[12px] font-normal text-black/40">
                {member.projects.map((s) => projectLabelMap[s] ?? s).join(", ")}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Filter Components ─────────── */

function FilterCheckbox({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-black/3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-black/20 text-[#FF6C0F] accent-[#FF6C0F] focus:ring-[#FF6C0F]/30"
      />
      <span className="font-['Pretendard',sans-serif] text-[13px] font-normal text-black/80">{label}</span>
      {count !== undefined && (
        <span className="ml-auto rounded-full bg-[#eee] px-2 py-0.5 text-[11px] font-medium text-[#666]">{count}</span>
      )}
    </label>
  );
}

/* ── Collapse Icons (YC-style square minus/plus) ── */
function MinusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor" className="text-[#bbb]">
      <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm88 200h144c13.3 0 24 10.7 24 24s-10.7 24-24 24H152c-13.3 0-24-10.7-24-24s10.7-24 24-24z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor" className="text-[#bbb]">
      <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm88 200h80V152c0-13.3 10.7-24 24-24s24 10.7 24 24v80h80c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v80c0 13.3-10.7 24-24 24s-24-10.7-24-24V280H152c-13.3 0-24-10.7-24-24s10.7-24 24-24z" />
    </svg>
  );
}

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [showAll, setShowAll] = useState(false);
  const childArray = Children.toArray(children);
  const visibleChildren = showAll ? childArray : childArray.slice(0, 7);
  const hasMoreOptions = childArray.length > 7;

  return (
    <div className="py-1">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-1 py-1.5 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#333] transition-colors hover:text-black"
      >
        {title}
        {expanded ? <MinusIcon /> : <PlusIcon />}
      </button>
      {expanded && (
        <div className="mt-1 space-y-0">
          {visibleChildren}
          {hasMoreOptions && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-1 px-1 font-['Pretendard',sans-serif] text-[13px] font-extralight text-[#268bd2] underline transition-colors hover:text-[#1a6ca8]"
            >
              See all options
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-[#d9d9cc]" />;
}

/* ─────────── Mobile Filter Select ─────────── */

type FilterOption = string | { value: string; label: string };

function MobileFilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  placeholder: string;
}) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
}

/* ─────────── Badges (unchanged) ─────────── */

const MEMBER_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "러너": { bg: "bg-blue-500/10", text: "text-blue-600", label: "러너" },
  "프러너": { bg: "bg-[#FF6C0F]/10", text: "text-[#FF6C0F]", label: "프러너" },
  alumni: { bg: "bg-emerald-500/10", text: "text-emerald-600", label: "알럼나이" },
};

function MemberTypeBadge({ type }: { type: string }) {
  const style = MEMBER_TYPE_STYLES[type];
  if (!style) return null;
  return (
    <span className={`rounded px-2 py-0.5 font-['Pretendard',sans-serif] text-[10px] font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}
