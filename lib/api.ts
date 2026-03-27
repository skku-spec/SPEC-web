/**
 * Data Access Layer
 *
 * This module provides a unified interface for all data access in the SPEC website.
 * Currently returns mock data from local data files.
 *
 * TO CONNECT A REAL BACKEND:
 * 1. Replace the function implementations below with fetch() calls to your API
 * 2. All functions are already async — no call-site changes needed
 * 3. Types are re-exported so consumers only import from '@/lib/api'
 *
 * Example migration:
 *   // Before (mock)
 *   export async function getCompanies() { return COMPANIES; }
 *
 *   // After (real API)
 *   export async function getCompanies() {
 *     const res = await fetch(`${API_BASE}/companies`);
 *     return res.json() as Promise<Company[]>;
 *   }
 */

export interface Company {
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

export interface Person {
  name: string;
  slug: string;
  title: string;
  bio: string;
  photo: string;
  isLead?: boolean;
  isPartner?: boolean;
  isMentor?: boolean;
  twitter?: string;
  linkedin?: string;
  website?: string;
  company?: string;
  batch?: string;
}

export interface PeopleSection {
  title: string;
  people: Person[];
}

export interface TeamDescription {
  name: string;
  description: string;
}

export interface FounderDirectory {
  id: string;
  name: string;
  slug: string;
  major: string | null;
  learnerBatch: string | null;
  preneurBatch: string | null;
  batchTags: string[];
  memberType: "러너" | "프러너" | "alumni";
  projects: string[];
  photoUrl: string | null;
  bio: string | null;
}

export interface CompanyFounder {
  name: string;
  title: string;
  linkedIn: string;
  twitter?: string;
}

export interface CompanyJob {
  title: string;
  location: string;
  experience: string;
}

export interface NewsItem {
  title: string;
  url: string;
  date: string;
}

export interface CompanyDetail {
  name: string;
  slug: string;
  oneLiner: string;
  batch: string;
  batchSeason: string;
  status: Database["public"]["Tables"]["projects"]["Row"]["status"];
  industries: string[];
  location: string;
  founded: number;
  teamSize: string;
  website: string;
  linkedIn?: string;
  twitter?: string;
  github?: string;
  description: string;
  founders: CompanyFounder[];
  jobs: CompanyJob[];
  news: NewsItem[];
  logoUrl: string | null;
  isHiring: boolean;
  isTopCompany: boolean;
}

import { createClient } from "@/lib/supabase/server";
import { CURRENT_BATCH } from "@/lib/constants";
import type { Database, MemberType, ProfileRole } from "@/lib/supabase/types";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type MemberRow = Database["public"]["Tables"]["members"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function handleQueryResult<T>(
  result: { data: T | null; error: { message: string; code?: string } | null },
  context: string,
  fallback: T
): T {
  if (result.error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[API] ${context}:`, result.error.message);
    }
    return fallback;
  }
  return result.data ?? fallback;
}

const DEFAULT_PERSON_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face";

const FOUNDER_MEMBER_TYPE_OPTIONS: FounderDirectory["memberType"][] = [
  "러너",
  "프러너",
  "alumni",
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorSlug: string;
  date: string;
  tags: string[];
  featured?: boolean;
  imageUrl?: string;
  type?: "news" | "blog";
  authorId?: string;
  authorRole?: ProfileRole;
  published?: boolean;
  id?: string;
  viewCount: number;
  authorCompany?: string;
  authorJobTitle?: string;
  authorBio?: string;
  authorAvatarUrl?: string;
}

export interface TagInfo {
  id: string;
  slug: string;
  label: string;
}

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type TagRow = Database["public"]["Tables"]["tags"]["Row"];

function createReadonlySupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getTagsByPostIds(
  postIds: string[]
): Promise<Map<string, string[]>> {
  const tagsByPostId = new Map<string, string[]>();

  if (postIds.length === 0) {
    return tagsByPostId;
  }

  const supabase = createReadonlySupabaseClient();
  const { data: postTags, error: postTagsError } = await supabase
    .from("post_tags")
    .select("post_id,tag_id")
    .in("post_id", postIds);

  if (postTagsError || !postTags || postTags.length === 0) {
    return tagsByPostId;
  }

  const tagIds = [...new Set(postTags.map((postTag) => postTag.tag_id))];
  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("id,slug")
    .in("id", tagIds);

  if (tagsError || !tags) {
    return tagsByPostId;
  }

  const tagSlugById = new Map(tags.map((tag) => [tag.id, tag.slug]));

  for (const postTag of postTags) {
    const slug = tagSlugById.get(postTag.tag_id);
    if (!slug) continue;

    const current = tagsByPostId.get(postTag.post_id) ?? [];
    current.push(slug);
    tagsByPostId.set(postTag.post_id, current);
  }

  return tagsByPostId;
}

async function mapRowsToBlogPosts(rows: PostRow[]): Promise<BlogPost[]> {
  if (rows.length === 0) {
    return [];
  }

  const supabase = createReadonlySupabaseClient();
  const authorIds = [...new Set(rows.map((row) => row.author_id))];

  const [profilesResult, tagsByPostId] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,name,slug,role,company,current_role,bio,photo")
      .in("id", authorIds),
    getTagsByPostIds(rows.map((row) => row.id)),
  ]);
  const profiles = handleQueryResult(
    profilesResult,
    "Failed to fetch blog post author profiles",
    []
  );

  const profileById = new Map<
    string,
    Pick<
      ProfileRow,
      "name" | "slug" | "role" | "company" | "current_role" | "bio" | "photo"
    >
  >(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return rows.map((row) => {
    const profile = profileById.get(row.author_id);
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      author: profile?.name ?? "",
      authorSlug: profile?.slug ?? "",
      authorRole: profile?.role,

      date: row.created_at,
      tags: tagsByPostId.get(row.id) ?? [],
      featured: row.featured,
      imageUrl: row.image_url,
      type: row.type,
      authorId: row.author_id,
      published: row.published,
      id: row.id,
      viewCount: row.view_count ?? 0,
      authorCompany: profile?.company || undefined,
      authorJobTitle: profile?.current_role || undefined,
      authorBio: profile?.bio || undefined,
      authorAvatarUrl: profile?.photo || undefined,
    };
  });
}

// ─── Companies ──────────────────────────────────────────────────────

export async function getCompanies(filters?: {
  industry?: string;
  batch?: string;
  region?: string;
  query?: string;
  isHiring?: boolean;
}): Promise<Company[]> {
  const projects = await getProjects({
    batch: filters?.batch,
    query: filters?.query,
  });

  let companies = projects.map((project) => ({
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

  if (filters?.industry) {
    companies = companies.filter((company) =>
      company.industry.includes(filters.industry as string),
    );
  }

  if (filters?.region) {
    companies = companies.filter((company) => company.region === filters.region);
  }

  if (filters?.isHiring) {
    companies = companies.filter((company) => company.isHiring);
  }

  return companies;
}

export async function getCompanyBySlug(
  slug: string
): Promise<Company | undefined> {
  const project = await getProjectBySlug(slug);
  if (!project) {
    return undefined;
  }

  return {
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
  };
}



export async function getCompanyFilterOptions() {
  const supabase = await createClient();
  const projectRowsResult = await supabase
    .from("projects")
    .select("batch,industries,region");
  const projectRows = handleQueryResult(
    projectRowsResult,
    "Failed to fetch company filter options",
    []
  );

  const batches = Array.from(
    new Set(
      (projectRows ?? [])
        .map((project) => project.batch)
        .filter((batch): batch is string => Boolean(batch)),
    ),
  )
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
    .map((batch) => ({ value: batch, label: batch }));

  const industries = Array.from(
    new Set((projectRows ?? []).flatMap((project) => project.industries ?? [])),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const regions = Array.from(
    new Set(
      (projectRows ?? [])
        .map((project) => project.region)
        .filter((region): region is string => Boolean(region)),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  return {
    batches,
    industries,
    regions,
  };
}

// ─── People ─────────────────────────────────────────────────────────

function isManagingLeadMember(member: Pick<MemberRow, "name" | "batch_tags">): boolean {
  if (member.name === "전도현" || member.name === "한지상") {
    return true;
  }

  return (member.batch_tags ?? []).some(
    (tag) => tag.includes("4기 회장") || tag.includes("4기 부회장"),
  );
}

function mapMemberToPerson(
  member: Pick<
    MemberRow,
    "name" | "slug" | "role" | "bio" | "photo_url" | "batch_tags" | "linkedin_url"
  >,
): Person {
  const isLead = isManagingLeadMember(member);
  return {
    name: member.name,
    slug: member.slug,
    title: member.role?.trim() || (isLead ? "Managing Lead" : "Preneur"),
    bio: member.bio ?? "",
    photo: member.photo_url ?? DEFAULT_PERSON_PHOTO,
    isLead,
    linkedin: member.linkedin_url ?? undefined,
  };
}

export async function getManagingLeads(): Promise<Person[]> {
  const supabase = await createClient();
  const membersResult = await supabase
    .from("members")
    .select("name,slug,role,bio,photo_url,batch_tags,linkedin_url")
    .eq("preneur_batch", CURRENT_BATCH)
    .order("name", { ascending: true });
  const members = handleQueryResult(
    membersResult,
    "Failed to fetch managing leads",
    []
  );

  return (members ?? [])
    .filter((member) => isManagingLeadMember(member))
    .map((member) => mapMemberToPerson(member));
}

export async function getPreneurs(): Promise<Person[]> {
  const supabase = await createClient();
  const membersResult = await supabase
    .from("members")
    .select("name,slug,role,bio,photo_url,batch_tags,linkedin_url")
    .eq("preneur_batch", CURRENT_BATCH)
    .order("name", { ascending: true });
  const members = handleQueryResult(
    membersResult,
    "Failed to fetch preneurs",
    []
  );

  return (members ?? [])
    .filter((member) => !isManagingLeadMember(member))
    .map((member) => mapMemberToPerson(member));
}



export async function getPersonBySlug(
  slug: string
): Promise<Person | undefined> {
  const member = await getMemberBySlug(slug);
  if (!member) {
    return undefined;
  }

  return mapMemberToPerson(member);
}



// ─── Blog ───────────────────────────────────────────────────────────

export async function getBlogPosts(
  options?: {
    tag?: string;
    type?: "news" | "blog";
    sort?: "newest" | "views";
    page?: number;
    pageSize?: number;
  }
): Promise<{ posts: BlogPost[]; totalCount: number }> {
  const supabase = createReadonlySupabaseClient();
  const { tag, type, sort = "newest", page = 1, pageSize = 20 } = options ?? {};

  let postIdsByTag: string[] | null = null;
  if (tag) {
    const tagRowResult = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag)
      .maybeSingle();
    const tagRow = handleQueryResult(
      tagRowResult,
      `Failed to fetch tag by slug: ${tag}`,
      null
    );

    if (!tagRow) {
      return { posts: [], totalCount: 0 };
    }

    const postTagsResult = await supabase
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", tagRow.id);
    const postTags = handleQueryResult(
      postTagsResult,
      `Failed to fetch post tags for tag id: ${tagRow.id}`,
      []
    );

    postIdsByTag = [...new Set((postTags ?? []).map((postTag) => postTag.post_id))];
    if (postIdsByTag.length === 0) {
      return { posts: [], totalCount: 0 };
    }
  }

  let query = supabase
    .from("posts")
    .select("*", { count: "exact", head: false })
    .eq("published", true);

  if (type) {
    query = query.eq("type", type);
  }

  if (postIdsByTag) {
    query = query.in("id", postIdsByTag);
  }

  query =
    sort === "views"
      ? query.order("view_count", { ascending: false })
      : query.order("created_at", { ascending: false });

  const rowsResult = await query.range((page - 1) * pageSize, page * pageSize - 1);
  const rows = handleQueryResult(rowsResult, "Failed to fetch blog posts", []);
  const totalCount = rowsResult.error ? 0 : (rowsResult.count ?? 0);

  return {
    posts: await mapRowsToBlogPosts(rows ?? []),
    totalCount,
  };
}

export async function getTrendingPosts(limit = 9): Promise<BlogPost[]> {
  const supabase = createReadonlySupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .gte("created_at", sevenDaysAgo)
    .order("view_count", { ascending: false })
    .limit(limit);

  const rows = handleQueryResult(result, "Failed to fetch trending posts", []);

  if ((rows?.length ?? 0) < limit) {
    const existingIds = (rows ?? []).map((r) => r.id);
    let fillQuery = supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit - (rows?.length ?? 0));

    if (existingIds.length > 0) {
      fillQuery = fillQuery.not("id", "in", `(${existingIds.join(",")})`);
    }

    const fillResult = await fillQuery;
    const fillRows = handleQueryResult(fillResult, "Failed to fetch fill posts", []);
    return mapRowsToBlogPosts([...(rows ?? []), ...(fillRows ?? [])]);
  }

  return mapRowsToBlogPosts(rows ?? []);
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  const supabase = createReadonlySupabaseClient();
  const rowResult = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  const row = handleQueryResult(
    rowResult,
    `Failed to fetch blog post by slug: ${slug}`,
    null
  );

  if (!row) {
    return undefined;
  }

  const [mapped] = await mapRowsToBlogPosts([row]);
  return mapped;
}

export async function getBlogPostBySlugForOwner(
  slug: string
): Promise<BlogPost | undefined> {
  const supabase = await createClient();
  const rowResult = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const row = handleQueryResult(
    rowResult,
    `Failed to fetch owner blog post by slug: ${slug}`,
    null
  );

  if (!row) {
    return undefined;
  }

  const [mapped] = await mapRowsToBlogPosts([row]);
  return mapped;
}

export async function getBlogPostsByAuthorId(authorId: string): Promise<BlogPost[]> {
  const supabase = createReadonlySupabaseClient();
  const rowsResult = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .eq("type", "blog")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const rows = handleQueryResult(rowsResult, `Failed to fetch blog posts by author: ${authorId}`, []);

  return mapRowsToBlogPosts(rows ?? []);
}

export async function getBlogPostsByAuthorIdForOwner(authorId: string): Promise<BlogPost[]> {
  const supabase = await createClient();
  const rowsResult = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .eq("type", "blog")
    .order("created_at", { ascending: false });

  const rows = handleQueryResult(rowsResult, `Failed to fetch owner blog posts by author: ${authorId}`, []);

  return mapRowsToBlogPosts(rows ?? []);
}

export async function getBlogTags(): Promise<TagInfo[]> {
  const supabase = createReadonlySupabaseClient();
  const result = await supabase.from("tags").select("id,slug,label");
  const data = handleQueryResult(result, "Failed to fetch blog tags", []);

  return (data ?? []).map((tag: Pick<TagRow, "id" | "slug" | "label">) => ({
    id: tag.id,
    slug: tag.slug,
    label: tag.label,
  }));
}

export async function getTagLabel(slug: string): Promise<string> {
  const supabase = createReadonlySupabaseClient();
  const dataResult = await supabase
    .from("tags")
    .select("label")
    .eq("slug", slug)
    .maybeSingle();
  const data = handleQueryResult(
    dataResult,
    `Failed to fetch tag label for slug: ${slug}`,
    null
  );

  return data?.label ?? slug;
}

export async function getRelatedPosts(
  currentSlug: string,
  limit?: number
): Promise<BlogPost[]> {
  const supabase = createReadonlySupabaseClient();
  const cappedLimit = limit ?? 3;

  const currentPostResult = await supabase
    .from("posts")
    .select("id")
    .eq("slug", currentSlug)
    .maybeSingle();
  const currentPost = handleQueryResult(
    currentPostResult,
    `Failed to fetch current post for related posts: ${currentSlug}`,
    null
  );

  if (!currentPost) {
    return [];
  }

  const currentPostTagsResult = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", currentPost.id);
  const currentPostTags = handleQueryResult(
    currentPostTagsResult,
    `Failed to fetch current post tags for related posts: ${currentPost.id}`,
    []
  );

  const tagIds = [...new Set((currentPostTags ?? []).map((postTag) => postTag.tag_id))];
  if (tagIds.length === 0) {
    return [];
  }

  const relatedPostTagsResult = await supabase
    .from("post_tags")
    .select("post_id")
    .in("tag_id", tagIds);
  const relatedPostTags = handleQueryResult(
    relatedPostTagsResult,
    `Failed to fetch related post tags for post: ${currentPost.id}`,
    []
  );

  const relatedPostIds = [...new Set((relatedPostTags ?? []).map((postTag) => postTag.post_id))]
    .filter((postId) => postId !== currentPost.id);

  if (relatedPostIds.length === 0) {
    return [];
  }

  const rowsResult = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .neq("slug", currentSlug)
    .in("id", relatedPostIds)
    .order("created_at", { ascending: false })
    .limit(cappedLimit);
  const rows = handleQueryResult(
    rowsResult,
    `Failed to fetch related posts for slug: ${currentSlug}`,
    []
  );

  return mapRowsToBlogPosts(rows ?? []);
}

// ─── Member Directory ───────────────────────────────────────────────

export async function getFounderDirectory(filters?: {
  batch?: string;
  memberType?: string;
  project?: string;
  query?: string;
}): Promise<FounderDirectory[]> {
  const supabase = await createClient();

  const [membersResult, relationsResult, projectsResult] = await Promise.all([
    supabase
      .from("members")
      .select(
        "id, name, slug, major, learner_batch, preneur_batch, batch_tags, member_type, photo_url, bio",
      ),
    supabase.from("member_projects").select("member_id,project_id"),
    supabase.from("projects").select("id,slug"),
  ]);
  const members = handleQueryResult(
    membersResult,
    "Failed to fetch founder directory members",
    []
  );
  const relations = handleQueryResult(
    relationsResult,
    "Failed to fetch founder directory member-project relations",
    []
  );
  const projects = handleQueryResult(
    projectsResult,
    "Failed to fetch founder directory projects",
    []
  );

  const projectSlugById = new Map<string, string>(
    (projects ?? []).map((project) => [project.id, project.slug]),
  );

  const projectsByMemberId = new Map<string, string[]>();
  for (const relation of relations ?? []) {
    const projectSlug = projectSlugById.get(relation.project_id);
    if (!projectSlug) {
      continue;
    }

    const currentProjects = projectsByMemberId.get(relation.member_id) ?? [];
    currentProjects.push(projectSlug);
    projectsByMemberId.set(relation.member_id, currentProjects);
  }

  let directory: FounderDirectory[] = (members ?? []).map((member) => {
    const memberType = member.member_type as string;
    return {
      id: member.id,
      name: member.name,
      slug: member.slug,
      major: member.major,
      learnerBatch: member.learner_batch,
      preneurBatch: member.preneur_batch,
      batchTags: member.batch_tags ?? [],
      memberType:
        memberType === "프러너" || memberType === "alumni"
          ? (memberType as FounderDirectory["memberType"])
          : "러너",
      projects: projectsByMemberId.get(member.id) ?? [],
      photoUrl: member.photo_url,
      bio: member.bio,
    };
  });

  if (filters?.batch) {
    directory = directory.filter((member) =>
      member.batchTags.some((tag) => tag.startsWith(filters.batch as string)),
    );
  }

  if (filters?.memberType) {
    directory = directory.filter(
      (member) => member.memberType === filters.memberType,
    );
  }

  if (filters?.project) {
    directory = directory.filter((member) =>
      member.projects.includes(filters.project as string),
    );
  }

  if (filters?.query) {
    const query = filters.query.toLowerCase();
    directory = directory.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        (member.major?.toLowerCase().includes(query) ?? false),
    );
  }

  return directory;
}

export async function getFounderDirectoryFilterOptions() {
  const supabase = await createClient();
  const [membersResult, projectsResult] = await Promise.all([
    supabase.from("members").select("learner_batch,member_type"),
    supabase.from("projects").select("slug,name"),
  ]);
  const members = handleQueryResult(
    membersResult,
    "Failed to fetch founder directory filter members",
    []
  );
  const projects = handleQueryResult(
    projectsResult,
    "Failed to fetch founder directory filter projects",
    []
  );

  const batches = Array.from(
    new Set(
      (members ?? [])
        .map((member) => member.learner_batch)
        .filter((batch): batch is string => Boolean(batch)),
    ),
  ).sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));

  const memberTypes = FOUNDER_MEMBER_TYPE_OPTIONS.filter((memberType) =>
    (members ?? []).some((member) => {
      if (memberType === "러너") {
        return member.member_type === "러너";
      }
      return member.member_type === memberType;
    }),
  );

  const projectOptions = (projects ?? []).map((project) => ({
    value: project.slug,
    label: project.name,
  }));

  return {
    batches,
    memberTypes,
    projects: projectOptions,
  };
}

// ─── Company Details ────────────────────────────────────────────────

export async function getCompanyDetail(
  slug: string
): Promise<CompanyDetail | undefined> {
  const supabase = await createClient();
  const projectResult = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const project = handleQueryResult(
    projectResult,
    `Failed to fetch company detail project by slug: ${slug}`,
    null
  );

  if (!project) {
    return undefined;
  }

  const [relationRowsResult, newsRowsResult] = await Promise.all([
    supabase
      .from("member_projects")
      .select("member_id,role")
      .eq("project_id", project.id),
    supabase
      .from("project_news")
      .select("title,url,date")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
  ]);
  const relationRows = handleQueryResult(
    relationRowsResult,
    `Failed to fetch company members for project: ${project.id}`,
    []
  );
  const newsRows = handleQueryResult(
    newsRowsResult,
    `Failed to fetch company news for project: ${project.id}`,
    []
  );

  const memberIds = (relationRows ?? []).map((relation) => relation.member_id);
  let members: Array<Pick<MemberRow, "id" | "name" | "linkedin_url">> = [];

  if (memberIds.length > 0) {
    const memberRowsResult = await supabase
      .from("members")
      .select("id,name,linkedin_url")
      .in("id", memberIds);
    members = handleQueryResult(
      memberRowsResult,
      `Failed to fetch company member details for project: ${project.id}`,
      []
    );
  }

  const memberById = new Map<string, Pick<MemberRow, "name" | "linkedin_url">>(
    members.map((member) => [member.id, member]),
  );

  const founders: CompanyFounder[] = (relationRows ?? [])
    .map((relation) => {
      const member = memberById.get(relation.member_id);
      if (!member) {
        return null;
      }

      return {
        name: member.name,
        title: relation.role ?? "팀원",
        linkedIn: member.linkedin_url ?? "#",
      };
    })
    .filter((founder): founder is CompanyFounder => founder !== null);

  const news: NewsItem[] = (newsRows ?? []).map((newsItem) => ({
    title: newsItem.title,
    url: newsItem.url ?? "#",
    date: newsItem.date ?? "",
  }));

  return {
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
}

export async function getAllCompanyDetailSlugs(): Promise<{ slug: string }[]> {
  const supabase = await createClient();
  const projectsResult = await supabase.from("projects").select("slug");
  const projects = handleQueryResult(
    projectsResult,
    "Failed to fetch company detail slugs",
    []
  );
  return (projects ?? []).map((project) => ({ slug: project.slug }));
}

export async function getRelatedCompanies(
  currentSlug: string
): Promise<CompanyDetail[]> {
  const supabase = await createClient();
  const projectsResult = await supabase
    .from("projects")
    .select("*")
    .neq("slug", currentSlug)
    .order("created_at", { ascending: false })
    .limit(4);
  const projects = handleQueryResult(
    projectsResult,
    `Failed to fetch related companies for slug: ${currentSlug}`,
    []
  );

  return (projects ?? []).map((project) => ({
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
    founders: [],
    jobs: [],
    news: [],
    logoUrl: project.logo_url,
    isHiring: project.is_hiring,
    isTopCompany: project.is_top_company,
  }));
}

// ─── Members ────────────────────────────────────────────────────────

export async function getMembers(filters?: {
  batch?: string;
  memberType?: MemberType;
  query?: string;
}): Promise<MemberRow[]> {
  const supabase = await createClient();

  let query = supabase.from("members").select("*");

  if (filters?.batch) {
    query = query.or(`learner_batch.eq.${filters.batch},preneur_batch.eq.${filters.batch}`);
  }

  if (filters?.memberType) {
    query = query.eq("member_type", filters.memberType);
  }

  if (filters?.query) {
    const q = filters.query.trim();
    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
    }
  }

  const rowsResult = await query;
  const rows = handleQueryResult(rowsResult, "Failed to fetch members", []);

  return rows ?? [];
}

export async function getMemberBySlug(slug: string): Promise<MemberRow | undefined> {
  const supabase = await createClient();
  const rowResult = await supabase
    .from("members")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const row = handleQueryResult(
    rowResult,
    `Failed to fetch member by slug: ${slug}`,
    null
  );

  return row ?? undefined;
}

// ─── Projects ───────────────────────────────────────────────────────

export async function getProjects(filters?: {
  batch?: string;
  query?: string;
}): Promise<ProjectRow[]> {
  const supabase = await createClient();

  let query = supabase.from("projects").select("*");

  if (filters?.batch) {
    query = query.eq("batch", filters.batch);
  }

  if (filters?.query) {
    const q = filters.query.trim();
    if (q) {
      query = query.or(`name.ilike.%${q}%,one_liner.ilike.%${q}%`);
    }
  }

  const rowsResult = await query;
  const rows = handleQueryResult(rowsResult, "Failed to fetch projects", []);

  return rows ?? [];
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | undefined> {
  const supabase = await createClient();
  const rowResult = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const row = handleQueryResult(
    rowResult,
    `Failed to fetch project by slug: ${slug}`,
    null
  );

  return row ?? undefined;
}


