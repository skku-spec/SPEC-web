import type { Metadata } from "next";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import type { Database } from "@/lib/supabase/types";

import CompaniesPageClient, {
  type BatchOption,
  type CompanyListItem,
} from "./CompaniesPageClient";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export const metadata: Metadata = {
  title: "프로젝트 | SPEC",
};

export const revalidate = 300;

function sortBatch(a: string, b: string) {
  const aNumber = Number.parseInt(a, 10);
  const bNumber = Number.parseInt(b, 10);
  if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) {
    return a.localeCompare(b, "ko");
  }
  return aNumber - bNumber;
}

export default async function CompaniesPage() {
  const supabase = createPublicServerClient();
  const { data: projectRows } = await supabase
    .from("projects")
    .select(
      "name, slug, one_liner, batch, industries, region, team_size, is_hiring, is_top_company, logo_url",
    )
    .order("created_at", { ascending: false });

  const companies: CompanyListItem[] = ((projectRows ?? []) as Pick<
    ProjectRow,
    | "name"
    | "slug"
    | "one_liner"
    | "batch"
    | "industries"
    | "region"
    | "team_size"
    | "is_hiring"
    | "is_top_company"
    | "logo_url"
  >[]).map((project) => ({
    name: project.name,
    slug: project.slug,
    oneLiner: project.one_liner ?? "",
    batch: project.batch ?? "미정",
    industry: project.industries ?? [],
    region: project.region ?? "미정",
    teamSize: project.team_size ?? 0,
    isHiring: project.is_hiring,
    isTopCompany: project.is_top_company,
    logoUrl: project.logo_url,
  }));

  const batchOptions: BatchOption[] = Array.from(
    new Set(
      ((projectRows ?? []) as Pick<ProjectRow, "batch">[])
        .map((project) => project.batch)
        .filter((batch): batch is string => Boolean(batch)),
    ),
  )
    .sort(sortBatch)
    .map((batch) => ({ value: batch, label: batch }));

  const industryOptions = Array.from(
    new Set(companies.flatMap((company) => company.industry)),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  return (
    <CompaniesPageClient
      companies={companies}
      batchOptions={batchOptions}
      industryOptions={industryOptions}
    />
  );
}
