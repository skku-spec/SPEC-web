import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/api";
import type { Database, ProfileRole } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileExperienceRow = Database["public"]["Tables"]["profile_experiences"]["Row"];

export type PublicProfile = Pick<
  ProfileRow,
  | "id"
  | "name"
  | "slug"
  | "role"
  | "bio"
  | "photo"
  | "company"
  | "headline"
  | "current_role"
  | "website_url"
  | "brunch_url"
  | "github_url"
  | "linkedin_url"

>;

export type PublicProfileExperience = Pick<
  ProfileExperienceRow,
  | "id"
  | "profile_id"
  | "organization"
  | "title"
  | "start_date"
  | "end_date"
  | "is_current"
  | "description"
  | "sort_order"
>;

export type PublicAuthorProfilePageData = {
  profile: PublicProfile;
  experiences: PublicProfileExperience[];
  posts: BlogPost[];
};

export const PUBLIC_AUTHOR_ROLES: ProfileRole[] = ["learner", "alumni", "preneur"];

export function isPublicAuthorRole(role: string | null | undefined): role is ProfileRole {
  return role === "learner" || role === "alumni" || role === "preneur";
}

export function isPublicAuthorProfile(profile: {
  slug?: string | null;
  role?: string | null;
} | null | undefined): profile is { slug: string; role: ProfileRole } {
  if (!profile?.slug?.trim()) {
    return false;
  }

  return isPublicAuthorRole(profile.role);
}

export function getPublicAuthorHref(profile: {
  slug?: string | null;
  role?: string | null;
} | null | undefined): string | null {
  if (!isPublicAuthorProfile(profile)) {
    return null;
  }

  return `/profile/${profile.slug}`;
}

export function getDisplayRoleLine(profile: Pick<PublicProfile, "current_role" | "company">): string | null {
  const currentRole = (profile.current_role ?? "").trim();
  const company = (profile.company ?? "").trim();

  if (currentRole && company) {
    return `${currentRole} @ ${company}`;
  }

  if (currentRole) {
    return currentRole;
  }

  if (company) {
    return company;
  }

  return null;
}

export function getPublicProfileLinks(profile: Pick<PublicProfile, "linkedin_url" | "website_url" | "brunch_url" | "github_url">) {
  return [
    { label: "LinkedIn", href: (profile.linkedin_url ?? "").trim() },
    { label: "Website", href: (profile.website_url ?? "").trim() },
    { label: "Brunch", href: (profile.brunch_url ?? "").trim() },
    { label: "GitHub", href: (profile.github_url ?? "").trim() },
  ].filter((link) => Boolean(link.href));
}

export async function getProfileExperiencesForOwner(profileId: string): Promise<PublicProfileExperience[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_experiences")
    .select("id, profile_id, organization, title, start_date, end_date, is_current, description, sort_order")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load profile experiences: ${error.message}`);
  }

  return data ?? [];
}

export type DirectoryProfileLink = Pick<PublicProfile, "slug" | "role">;

export async function getProfilesForDirectory(profileIds: string[], candidateSlugs: string[] = []) {
  if (profileIds.length === 0 && candidateSlugs.length === 0) {
    return {
      byId: new Map<string, DirectoryProfileLink>(),
      bySlug: new Map<string, DirectoryProfileLink>(),
    };
  }

  const supabase = await createClient();
  const [byIdResult, bySlugResult] = await Promise.all([
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, slug, role")
          .in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    candidateSlugs.length > 0
      ? supabase
          .from("profiles")
          .select("id, slug, role")
          .in("slug", candidateSlugs)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (byIdResult.error) {
    throw new Error(`Failed to load linked public profiles: ${byIdResult.error.message}`);
  }

  if (bySlugResult.error) {
    throw new Error(`Failed to load fallback public profiles: ${bySlugResult.error.message}`);
  }

  const mergedProfiles = [...(byIdResult.data ?? []), ...(bySlugResult.data ?? [])];

  const normalizedProfiles = mergedProfiles.map((profile) => ({
    id: profile.id,
    slug: profile.slug,
    role: profile.role,
  }));

  return {
    byId: new Map(normalizedProfiles.map((profile) => [profile.id, profile])),
    bySlug: new Map(normalizedProfiles.map((profile) => [profile.slug, profile])),
  };
}

export function resolveDirectoryProfileLink(
  publicProfileId: string | null | undefined,
  memberSlug: string,
  lookup: {
    byId: Map<string, DirectoryProfileLink>;
    bySlug: Map<string, DirectoryProfileLink>;
  },
) {
  if (publicProfileId) {
    const linkedProfile = lookup.byId.get(publicProfileId);
    if (linkedProfile) {
      return linkedProfile;
    }
  }

  return lookup.bySlug.get(memberSlug) ?? null;
}

export async function getPublicAuthorProfilePageData(slug: string): Promise<PublicAuthorProfilePageData | null> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, name, slug, role, bio, photo, company, headline, current_role, website_url, brunch_url, github_url, linkedin_url",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to load public author profile: ${profileError.message}`);
  }

  if (!profile || !isPublicAuthorProfile(profile)) {
    return null;
  }

  const [{ data: experiences, error: experiencesError }, { getBlogPostsByAuthorId }] = await Promise.all([
    supabase
      .from("profile_experiences")
      .select("id, profile_id, organization, title, start_date, end_date, is_current, description, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    import("@/lib/api"),
  ]);

  if (experiencesError) {
    throw new Error(`Failed to load public author experiences: ${experiencesError.message}`);
  }

  const posts = await getBlogPostsByAuthorId(profile.id);

  return {
    profile,
    experiences: experiences ?? [],
    posts,
  };
}
