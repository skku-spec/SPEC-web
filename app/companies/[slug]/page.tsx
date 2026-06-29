import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { Database } from "@/lib/supabase/types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type MemberRow = Database["public"]["Tables"]["members"]["Row"];
type MemberProjectRow = Database["public"]["Tables"]["member_projects"]["Row"];
type ProjectNewsRow = Database["public"]["Tables"]["project_news"]["Row"];

export const revalidate = 300;

interface Founder {
  name: string;
  title: string;
  linkedIn: string;
  twitter?: string;
}

interface Job {
  title: string;
  location: string;
  experience: string;
}

interface NewsItem {
  title: string;
  url: string;
  date: string;
}

interface CompanyDetail {
  name: string;
  slug: string;
  oneLiner: string;
  batch: string;
  batchSeason: string;
  status: ProjectRow["status"];
  industries: string[];
  location: string;
  founded: number;
  teamSize: string;
  website: string;
  linkedIn?: string;
  twitter?: string;
  github?: string;
  description: string;
  founders: Founder[];
  jobs: Job[];
  news: NewsItem[];
  logoUrl: string | null;
  isHiring: boolean;
  isTopCompany: boolean;
}

interface RelatedCompany {
  name: string;
  slug: string;
  oneLiner: string;
}

const getCompanyPageData = cache(async function getCompanyPageData(
  slug: string,
): Promise<{ company: CompanyDetail; related: RelatedCompany[] } | null> {
  const supabase = createPublicServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!project) {
    return null;
  }

  const [{ data: projectMemberRows }, { data: projectNewsRows }, { data: relatedRows }] =
    await Promise.all([
      supabase
        .from("member_projects")
        .select("member_id, role")
        .eq("project_id", project.id),
      supabase
        .from("project_news")
        .select("title, url, date")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("name, slug, one_liner")
        .neq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

  const memberIds = ((projectMemberRows ?? []) as Pick<
    MemberProjectRow,
    "member_id"
  >[]).map((projectMember) => projectMember.member_id);

  let memberRows: Array<Pick<MemberRow, "id" | "name" | "linkedin_url">> = [];
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from("members")
      .select("id, name, linkedin_url")
      .in("id", memberIds);
    memberRows = data ?? [];
  }

  const memberById = new Map<string, Pick<MemberRow, "name" | "linkedin_url">>(
    memberRows.map((member) => [member.id, member]),
  );

  const founders: Founder[] = ((projectMemberRows ?? []) as Pick<
    MemberProjectRow,
    "member_id" | "role"
  >[])
    .map((projectMember) => {
      const member = memberById.get(projectMember.member_id);
      if (!member) {
        return null;
      }

      return {
        name: member.name,
        title: projectMember.role ?? "팀원",
        linkedIn: member.linkedin_url ?? "#",
      };
    })
    .filter((founder): founder is Founder => founder !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const news: NewsItem[] = ((projectNewsRows ?? []) as Pick<
    ProjectNewsRow,
    "title" | "url" | "date"
  >[]).map((newsItem) => ({
    title: newsItem.title,
    url: newsItem.url ?? "#",
    date: newsItem.date ?? "",
  }));

  const company: CompanyDetail = {
    name: project.name,
    slug: project.slug,
    oneLiner: project.one_liner ?? "",
    batch: project.batch ?? "",
    batchSeason: project.batch ?? "",
    status: project.status,
    industries: project.industries ?? [],
    location: project.region ?? "",
    founded: project.founded_year ?? 0,
    teamSize: project.team_size ? `${project.team_size}명` : "-",
    website: project.website ?? "#",
    linkedIn: project.linkedin_url ?? undefined,
    twitter: project.twitter_url ?? undefined,
    github: project.github_url ?? undefined,
    description: project.description ?? "",
    founders,
    jobs: [],
    news,
    logoUrl: project.logo_url,
    isHiring: project.is_hiring,
    isTopCompany: project.is_top_company,
  };

  const related: RelatedCompany[] = (relatedRows ?? []).map((relatedProject) => ({
    name: relatedProject.name,
    slug: relatedProject.slug,
    oneLiner: relatedProject.one_liner ?? "",
  }));

  return { company, related };
});

export async function generateStaticParams() {
  const supabase = createPublicServerClient();
  const { data } = await supabase.from("projects").select("slug");

  return (data ?? []).map((project) => ({ slug: project.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getCompanyPageData(slug);

  if (!pageData) {
    return { title: "Company Not Found | SPEC" };
  }

  const { company } = pageData;
  const descriptionSource = company.description || company.oneLiner;

  return {
    title: `${company.name}: ${company.oneLiner} | SPEC`,
    description: descriptionSource.slice(0, 160),
  };
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const pageData = await getCompanyPageData(slug);

  if (!pageData) {
    notFound();
  }

  const { company, related } = pageData;

  return (
    <div className="px-4 pb-24 pt-12 md:pt-16">
      <div className="mx-auto max-w-[1100px]">
        <nav className="mb-8 flex items-center gap-2 font-['Pretendard',sans-serif] text-[13px] font-normal text-[#16140f]/50">
          <Link href="/" className="transition-colors hover:text-[#FF6C0F]">
            Home
          </Link>
          <span className="text-[#16140f]/30">&rsaquo;</span>
          <Link href="/companies" className="transition-colors hover:text-[#FF6C0F]">
            Companies
          </Link>
          <span className="text-[#16140f]/30">&rsaquo;</span>
          <span className="text-[#16140f]/70">{company.name}</span>
        </nav>

        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="min-w-0 flex-1">
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-5">
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-[#16140f]/8 bg-white shadow-sm">
                  <span className="font-['Pretendard',sans-serif] text-[28px] font-bold text-[#FF6C0F]">
                    {company.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="font-[system-ui] text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-[#16140f]">
                    {company.name}
                  </h1>
                  <p className="mt-1 font-['Pretendard',sans-serif] text-[17px] font-normal text-[#16140f]/70">
                    {company.oneLiner}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/companies?batch=${encodeURIComponent(company.batchSeason)}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6C0F]/10 px-3 py-1 font-['Pretendard',sans-serif] text-[12px] font-medium text-[#FF6C0F] transition-colors hover:bg-[#FF6C0F]/20"
                >
                  <SPECLogoSmall />
                  {company.batchSeason}
                </Link>
                <StatusBadge status={company.status} />
                {company.industries.map((ind) => (
                  <span
                    key={ind}
                    className="rounded-full bg-[#16140f]/5 px-3 py-1 font-['Pretendard',sans-serif] text-[12px] font-normal text-[#16140f]/60"
                  >
                    {ind}
                  </span>
                ))}
                <span className="rounded-full bg-[#16140f]/5 px-3 py-1 font-['Pretendard',sans-serif] text-[12px] font-normal text-[#16140f]/60">
                  {company.location}
                </span>
              </div>
            </div>

            <div className="mb-6 border-y border-[#16140f]/8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-6 font-['Pretendard',sans-serif] text-[14px] font-medium">
                  <span className="border-b-2 border-[#FF6C0F] pb-1 text-[#FF6C0F]">Company</span>
                  {company.jobs.length > 0 && (
                    <span className="flex items-center gap-1 text-[#16140f]/60">
                      채용 공고
                      <span className="rounded-full bg-[#16140f]/8 px-1.5 py-0.5 text-[11px]">
                        {company.jobs.length}
                      </span>
                    </span>
                  )}
                </div>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]/60 transition-colors hover:text-[#FF6C0F]"
                >
                  <ExternalLinkIcon />
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>

            <section className="mb-10">
              <p className="font-['Pretendard',sans-serif] text-[16px] font-normal leading-[1.8] text-[#16140f]">
                {company.description}
              </p>
            </section>

            {company.news.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 font-['Pretendard',sans-serif] text-[18px] font-semibold text-[#16140f]">
                  뉴스
                </h2>
                <div className="space-y-3">
                  {company.news.map((item) => (
                    <div key={`${item.title}-${item.url}`} className="flex items-start justify-between gap-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-['Pretendard',sans-serif] text-[14px] font-normal text-[#16140f] underline decoration-[#16140f]/20 underline-offset-2 transition-colors hover:text-[#FF6C0F] hover:decoration-[#FF6C0F]/40"
                      >
                        {item.title}
                      </a>
                      <span className="shrink-0 font-['Pretendard',sans-serif] text-[12px] font-normal text-[#16140f]/40">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {company.jobs.length > 0 && (
              <section className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-['Pretendard',sans-serif] text-[18px] font-semibold text-[#16140f]">
                    채용 공고
                  </h2>
                </div>
                <div className="space-y-0 divide-y divide-[#16140f]/6 rounded-lg border border-[#16140f]/8 bg-white">
                  {company.jobs.map((job) => (
                    <div
                      key={job.title}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <h3 className="font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#16140f]">
                          {job.title}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-2 font-['Pretendard',sans-serif] text-[12px] font-normal text-[#16140f]/50">
                          <span>{job.location}</span>
                          <span className="text-[#16140f]/20">&bull;</span>
                          <span>{job.experience}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#FF6C0F]/10 px-3 py-1.5 font-['Pretendard',sans-serif] text-[12px] font-medium text-[#FF6C0F] transition-colors hover:bg-[#FF6C0F]/20">
                        지원하기 &rsaquo;
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-10">
              <h2 className="mb-5 font-['Pretendard',sans-serif] text-[18px] font-semibold text-[#16140f]">
                창업자
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {company.founders.map((founder) => (
                  <div
                    key={founder.name}
                    className="flex items-center gap-4 rounded-lg border border-[#16140f]/8 bg-white p-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8e8df]">
                      <span className="font-['Pretendard',sans-serif] text-[18px] font-bold text-[#16140f]/50">
                        {founder.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-['Pretendard',sans-serif] text-[14px] font-semibold text-[#16140f]">
                          {founder.name}
                        </h3>
                        <div className="flex gap-1.5">
                          {founder.twitter && (
                            <a
                              href={founder.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/40 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                              aria-label={`${founder.name} on Twitter`}
                            >
                              <XIcon />
                            </a>
                          )}
                          <a
                            href={founder.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/40 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                            aria-label={`${founder.name} on LinkedIn`}
                          >
                            <LinkedInIcon />
                          </a>
                        </div>
                      </div>
                      <p className="font-['Pretendard',sans-serif] text-[12px] font-normal text-[#16140f]/50">
                        {founder.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="w-full shrink-0 lg:w-[280px]">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl border border-[#16140f]/8 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#16140f]/8 bg-[#f5f5ee]">
                    <span className="font-['Pretendard',sans-serif] text-[16px] font-bold text-[#FF6C0F]">
                      {company.name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-['Pretendard',sans-serif] text-[15px] font-semibold text-[#16140f]">
                    {company.name}
                  </span>
                </div>

                <div className="space-y-3">
                  <InfoRow label="설립" value={company.founded > 0 ? String(company.founded) : "-"} />
                  <InfoRow label="기수" value={company.batchSeason || "-"} />
                  <InfoRow label="팀 규모" value={company.teamSize} />
                  <InfoRow label="상태" value={company.status} />
                  <InfoRow label="위치" value={company.location || "-"} />
                </div>

                <div className="mt-5 flex gap-2 border-t border-[#16140f]/8 pt-4">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/50 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                    aria-label="Website"
                  >
                    <GlobeIcon />
                  </a>
                  {company.linkedIn && (
                    <a
                      href={company.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/50 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                      aria-label="LinkedIn"
                    >
                      <LinkedInIcon />
                    </a>
                  )}
                  {company.twitter && (
                    <a
                      href={company.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/50 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                      aria-label="Twitter"
                    >
                      <XIcon />
                    </a>
                  )}
                  {company.github && (
                    <a
                      href={company.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#16140f]/5 text-[#16140f]/50 transition-colors hover:bg-[#16140f]/10 hover:text-[#16140f]"
                      aria-label="GitHub"
                    >
                      <GitHubIcon />
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#16140f]/8 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-['Pretendard',sans-serif] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#16140f]/50">
                  관련 회사
                </h3>
                <div className="space-y-3">
                  {related.map((relatedCompany) => (
                    <Link
                      key={relatedCompany.slug}
                      href={`/companies/${relatedCompany.slug}`}
                      className="group flex items-center gap-3 rounded-md p-1 transition-colors hover:bg-[#FF6C0F]/5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#16140f]/8 bg-[#f5f5ee]">
                        <span className="font-['Pretendard',sans-serif] text-[12px] font-bold text-[#FF6C0F]">
                          {relatedCompany.name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#16140f] transition-colors group-hover:text-[#FF6C0F]">
                          {relatedCompany.name}
                        </p>
                        <p className="truncate font-['Pretendard',sans-serif] text-[11px] font-normal text-[#16140f]/50">
                          {relatedCompany.oneLiner}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-['Pretendard',sans-serif] text-[13px] font-normal text-[#16140f]/50">
        {label}:
      </span>
      <span className="font-['Pretendard',sans-serif] text-[13px] font-medium text-[#16140f]">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: CompanyDetail["status"] }) {
  const colors: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Public: "bg-blue-100 text-blue-700",
    Acquired: "bg-amber-100 text-amber-700",
    Inactive: "bg-[#16140f]/8 text-[#16140f]/50",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 font-['Pretendard',sans-serif] text-[12px] font-medium ${colors[status] || colors.Active}`}
    >
      {status}
    </span>
  );
}

function SPECLogoSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FF6C0F" />
      <text x="12" y="16" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="system-ui">S</text>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
