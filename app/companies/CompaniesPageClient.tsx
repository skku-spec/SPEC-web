"use client";

import { useState, useMemo, useCallback, Children } from "react";

import Image from "next/image";
import Link from "next/link";
import CustomSelect from "@/components/ui/CustomSelect";
import PageHeader from "@/components/PageHeader";

export interface CompanyListItem {
  name: string;
  slug: string;
  oneLiner: string;
  batch: string;
  industry: string[];
  region: string;
  teamSize: number;
  isHiring: boolean;
  isTopCompany: boolean;
  logoUrl: string | null;
}

export interface BatchOption {
  value: string;
  label: string;
}

interface CompaniesPageClientProps {
  companies: CompanyListItem[];
  batchOptions: BatchOption[];
  industryOptions: string[];
}

const ITEMS_PER_PAGE = 40;

export default function CompaniesPageClient({
  companies: COMPANIES,
  batchOptions: BATCH_OPTIONS,
  industryOptions: INDUSTRY_OPTIONS,
}: CompaniesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sortBy, setSortBy] = useState<"default" | "batch-asc" | "batch-desc">("default");


  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const [batchExpanded, setBatchExpanded] = useState(true);
  const [industryExpanded, setIndustryExpanded] = useState(true);

  const toggleArrayItem = useCallback((arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }, []);

  /* ── Count computations from FULL COMPANIES array ── */
  const batchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of COMPANIES) {
      counts[c.batch] = (counts[c.batch] || 0) + 1;
    }
    return counts;
  }, [COMPANIES]);

  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of COMPANIES) {
      for (const ind of c.industry) {
        counts[ind] = (counts[ind] || 0) + 1;
      }
    }
    return counts;
  }, [COMPANIES]);


  const filteredCompanies = useMemo(() => {
    const filtered = COMPANIES.filter((c) => {
      const q = searchQuery.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.oneLiner.toLowerCase().includes(q)) {
        return false;
      }

      if (selectedBatches.length > 0 && !selectedBatches.includes(c.batch)) return false;
      if (selectedIndustries.length > 0 && !c.industry.some((ind) => selectedIndustries.includes(ind))) return false;
      return true;
    });

    if (sortBy === "batch-asc") {
      return [...filtered].sort((a, b) => {
        const batchOrder = BATCH_OPTIONS.map((o) => o.value);
        return batchOrder.indexOf(a.batch) - batchOrder.indexOf(b.batch);
      });
    }

    if (sortBy === "batch-desc") {
      return [...filtered].sort((a, b) => {
        const batchOrder = BATCH_OPTIONS.map((o) => o.value);
        return batchOrder.indexOf(b.batch) - batchOrder.indexOf(a.batch);
      });
    }

    return filtered;
  }, [
    searchQuery,
    selectedBatches, selectedIndustries, sortBy, COMPANIES, BATCH_OPTIONS,
  ]);

  const displayedCompanies = filteredCompanies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCompanies.length;

  return (
    <div className="min-h-screen px-4 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="mx-auto max-w-[1100px]">
        <PageHeader title="SPEC Projects" align="center" />
        <p className="mx-auto mb-8 max-w-[640px] text-center font-['Pretendard',sans-serif] text-[15px] font-normal leading-relaxed text-black/60">
          SPEC에서 탄생한 프로젝트들입니다. 매주 챌린지를 거쳐 실제 사업으로
          성장한 팀들을 만나보세요.
        </p>
      </div>

      {/* Sort row - above the two-column layout like YC */}
      <div className="mx-auto mb-4 flex max-w-[1100px] flex-wrap items-center justify-between gap-2 sm:justify-end">
        <span className="font-['Pretendard',sans-serif] text-[13px] font-normal text-black/50">
          정렬:
        </span>
        <CustomSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as "default" | "batch-asc" | "batch-desc")}
          options={[
            { value: "default", label: "기본" },
            { value: "batch-asc", label: "기수순 ↑" },
            { value: "batch-desc", label: "기수순 ↓" },
          ]}
          className="w-[140px]"
        />
      </div>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-5 lg:flex-row">
        <div className="space-y-3 lg:hidden">
          <details className="rounded-lg border border-[#ddd9cc] bg-white p-4">
            <summary className="cursor-pointer font-['Pretendard',sans-serif] text-sm font-semibold text-[#16140f]">
              필터
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">기수</p>
                <div className="max-h-[220px] overflow-y-auto">
                  <FilterCheckbox label="전체" checked={selectedBatches.length === 0} onChange={() => setSelectedBatches([])} count={COMPANIES.length} small />
                  {BATCH_OPTIONS.map((batch) => (
                    <FilterCheckbox key={batch.value} label={batch.label} checked={selectedBatches.includes(batch.value)} onChange={() => setSelectedBatches(toggleArrayItem(selectedBatches, batch.value))} count={batchCounts[batch.value] || 0} small />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-['Pretendard',sans-serif] text-xs font-semibold text-[#6b6b5e]">분야</p>
                <div className="max-h-[220px] overflow-y-auto">
                  <FilterCheckbox label="전체" checked={selectedIndustries.length === 0} onChange={() => setSelectedIndustries([])} count={COMPANIES.length} small />
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <FilterCheckbox key={ind} label={ind} checked={selectedIndustries.includes(ind)} onChange={() => setSelectedIndustries(toggleArrayItem(selectedIndustries, ind))} count={industryCounts[ind] || 0} small />
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
        {/* ── Sidebar ── */}
        <aside className="sticky top-[100px] hidden w-[300px] shrink-0 self-start lg:block">
          <div
            className="max-h-[calc(100vh-120px)] space-y-0 overflow-y-auto rounded-lg border border-[#d9d9cc] bg-white p-5"
          >

            {/* ── Batch filter ── */}
            <FilterSection title="기수" isFirst expanded={batchExpanded} onToggle={() => setBatchExpanded(!batchExpanded)} allCount={COMPANIES.length} allChecked={selectedBatches.length === 0} onAllChange={() => setSelectedBatches([])}>
              {BATCH_OPTIONS.map((batch) => (
                <FilterCheckbox key={batch.value} label={batch.label} checked={selectedBatches.includes(batch.value)} onChange={() => setSelectedBatches(toggleArrayItem(selectedBatches, batch.value))} count={batchCounts[batch.value] || 0} small />
              ))}
            </FilterSection>

            {/* ── Industry filter ── */}
            <FilterSection title="분야" expanded={industryExpanded} onToggle={() => setIndustryExpanded(!industryExpanded)} allCount={COMPANIES.length} allChecked={selectedIndustries.length === 0} onAllChange={() => setSelectedIndustries([])}>
              {INDUSTRY_OPTIONS.map((ind) => (
                <FilterCheckbox key={ind} label={ind} checked={selectedIndustries.includes(ind)} onChange={() => setSelectedIndustries(toggleArrayItem(selectedIndustries, ind))} count={industryCounts[ind] || 0} small />
              ))}
            </FilterSection>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="min-w-0 flex-1">
          {/* Search bar */}
          <div className="mb-4">
            <div className="rounded-lg border border-[#d9d9cc] bg-white p-5">
              <input
                type="text"
                placeholder="프로젝트 검색..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                className="h-[42px] w-full min-w-0 rounded-lg border border-[#d9d9cc] bg-white px-2.5 py-2.5 font-['Pretendard',sans-serif] text-base font-normal text-black outline-none placeholder:text-black/40 focus:border-[#999] focus:ring-0"
              />
            </div>
            <p className="mt-2 px-1 font-['Pretendard',sans-serif] text-[13px] font-normal text-black/50">
              Showing {filteredCompanies.length} of {COMPANIES.length} 프로젝트
            </p>
          </div>

          {displayedCompanies.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#d9d9cc]">
               {displayedCompanies.map((company, index) => (
                 <Link key={company.slug} href={`/companies/${company.slug}`}>
                   <CompanyCard
                     company={company}
                     isFirst={index === 0}
                     isLast={index === displayedCompanies.length - 1}
                   />
                 </Link>
               ))}
             </div>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="rounded-lg border border-black/10 bg-black/3 px-8 py-2.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-black/60 transition-all hover:bg-black/5 hover:text-black"
              >
                더 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── CompanyCard (UNCHANGED) ── */
function CompanyCard({ company, isFirst = false, isLast = false }: { company: CompanyListItem; isFirst?: boolean; isLast?: boolean }) {
  const roundingClass = isFirst && isLast
    ? "rounded-lg"
    : isFirst
      ? "rounded-t-lg"
      : isLast
        ? "rounded-b-lg"
        : "";

  return (
    <div
      className={`group flex items-center gap-4 bg-white px-5 py-4 ${!isLast ? "border-b border-[#d9d9cc]" : ""} ${roundingClass}`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#efefe8]">
        {company.logoUrl ? (
          <Image src={company.logoUrl} alt={company.name} width={56} height={56} className="h-full w-full object-cover" />
        ) : (
          <span className="font-['Pretendard',sans-serif] text-[18px] font-bold text-[#FF6C0F]">
            {company.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-['Pretendard',sans-serif] text-[18px] font-semibold text-black transition-colors group-hover:text-[#FF6C0F]">
            {company.name}
          </span>
          <span className="font-['Pretendard',sans-serif] text-[15px] font-normal text-black/70">
            {company.batch}
          </span>
          {company.isTopCompany && (
            <span className="rounded bg-[#FF6C0F]/10 px-2 py-0.5 font-['Pretendard',sans-serif] text-[10px] font-semibold text-[#FF6C0F]">
              주요
            </span>
          )}
        </div>
        <p className="mt-1 truncate font-['Pretendard',sans-serif] text-[13px] font-normal text-black/50">
          {company.oneLiner}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {company.industry.map((tag) => (
            <span key={tag} className="rounded bg-[#e6e6dd] px-2.5 py-1 font-['Pretendard',sans-serif] text-[10px] font-medium text-[#333]">
              {tag}
            </span>
          ))}
          {company.isHiring && (
            <span className="rounded bg-green-100 px-2.5 py-1 font-['Pretendard',sans-serif] text-[10px] font-medium text-green-700">
              채용 중
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── FilterCheckbox ── */
function FilterCheckbox({
  label,
  checked,
  onChange,
  count,
  small = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
  small?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 transition-colors hover:bg-black/3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-black/20 text-[#FF6C0F] accent-[#FF6C0F] focus:ring-[#FF6C0F]/30 focus:ring-offset-0"
      />
      <span className={`min-w-0 break-words font-['Pretendard',sans-serif] font-normal text-black/80 ${small ? "text-[13px]" : "text-[14px]"}`}>
        {label}
      </span>
      {count !== undefined && (
        <span className="ml-auto rounded-full bg-[#eee] px-2 py-0.5 text-[11px] font-medium text-[#666]">
          {count}
        </span>
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

/* ── FilterSection ── */
function FilterSection({
  title,
  expanded,
  onToggle,
  allCount,
  allChecked,
  onAllChange,
  children,
  isFirst,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  allCount?: number;
  allChecked?: boolean;
  onAllChange?: () => void;
  children: React.ReactNode;
  isFirst?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const childArray = Children.toArray(children);
  const visibleChildren = showAll ? childArray : childArray.slice(0, 7);
  const hasMoreOptions = childArray.length > 7;

  return (
    <div>
      {!isFirst && <Divider />}
      <div className="py-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between px-1 py-1.5 font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#333] transition-colors hover:text-black"
        >
          {title}
          {expanded ? <MinusIcon /> : <PlusIcon />}
        </button>
        {expanded && (
          <div className="mt-1 space-y-0">
            {allChecked !== undefined && onAllChange && (
              <FilterCheckbox
                label="전체"
                checked={allChecked}
                onChange={onAllChange}
                count={allCount}
              />
            )}
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
    </div>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="h-px bg-[#d9d9cc]" />;
}

/* ── EmptyState (UNCHANGED) ── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d9d9cc] py-20">
      <svg className="mb-4 h-12 w-12 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p className="font-['Pretendard',sans-serif] text-[15px] font-normal text-black/50">
        검색 결과가 없습니다.
      </p>
    </div>
  );
}
