import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

import FoundersPageClient, {
  type Member as FounderMember,
  type ProjectOption,
} from "./FoundersPageClient";

type MemberRow = Database["public"]["Tables"]["members"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type MemberProjectRow = Database["public"]["Tables"]["member_projects"]["Row"];

export const metadata: Metadata = {
  title: "팀 소개 | SPEC",
};

const MEMBER_TYPE_ORDER: FounderMember["memberType"][] = ["러너", "프러너", "alumni"];

function sortBatch(a: string, b: string) {
  const aNumber = Number.parseInt(a, 10);
  const bNumber = Number.parseInt(b, 10);
  if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) {
    return a.localeCompare(b, "ko");
  }
  return aNumber - bNumber;
}

function normalizeMemberType(
  value: MemberRow["member_type"],
): FounderMember["memberType"] {
  const normalized = value as string;
  if (normalized === "프러너" || normalized === "alumni") {
    return normalized;
  }
  return "러너";
}

export default async function FoundersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  const [{ data: memberRows }, { data: projectRows }, { data: memberProjectRows }] =
    await Promise.all([
      supabase
        .from("members")
        .select(
          "id, name, slug, major, learner_batch, preneur_batch, batch_tags, member_type, photo_url, bio",
        )
        .order("name", { ascending: true }),
      supabase
        .from("projects")
        .select("id, slug, name")
        .order("name", { ascending: true }),
      supabase.from("member_projects").select("member_id, project_id"),
    ]);

  const projectSlugById = new Map<string, string>(
    (projectRows ?? []).map((project: Pick<ProjectRow, "id" | "slug">) => [
      project.id,
      project.slug,
    ]),
  );

  const projectsByMemberId = new Map<string, string[]>();
  for (const relation of (memberProjectRows ?? []) as Pick<
    MemberProjectRow,
    "member_id" | "project_id"
  >[]) {
    const projectSlug = projectSlugById.get(relation.project_id);
    if (!projectSlug) {
      continue;
    }

    const currentProjects = projectsByMemberId.get(relation.member_id) ?? [];
    currentProjects.push(projectSlug);
    projectsByMemberId.set(relation.member_id, currentProjects);
  }

  const members: FounderMember[] = ((memberRows ?? []) as Pick<
    MemberRow,
    | "id"
    | "name"
    | "slug"
    | "major"
    | "learner_batch"
    | "preneur_batch"
    | "batch_tags"
    | "member_type"
    | "photo_url"
    | "bio"
  >[])
    .map((member) => ({
      id: member.id,
      name: member.name,
      slug: member.slug,
      major: member.major,
      learnerBatch: member.learner_batch,
      preneurBatch: member.preneur_batch,
      batchTags: member.batch_tags ?? [],
      memberType: normalizeMemberType(member.member_type),
      projects: projectsByMemberId.get(member.id) ?? [],
      photoUrl: member.photo_url,
      bio: member.bio,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const batchOptions = Array.from(
    new Set(
      ((memberRows ?? []) as Pick<MemberRow, "learner_batch">[])
        .map((member) => member.learner_batch)
        .filter((batch): batch is string => Boolean(batch)),
    ),
  ).sort(sortBatch);

  const memberTypeOptions = MEMBER_TYPE_ORDER.filter((type) =>
    members.some((member) => member.memberType === type),
  );

  const projectOptions: ProjectOption[] = ((projectRows ?? []) as Pick<
    ProjectRow,
    "slug" | "name"
  >[]).map((project) => ({
    value: project.slug,
    label: project.name,
  }));

  return (
    <FoundersPageClient
      members={members}
      batchOptions={batchOptions}
      memberTypeOptions={memberTypeOptions}
      projectOptions={projectOptions}
      isLoggedIn={isLoggedIn}
    />
  );
}
