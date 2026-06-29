import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import type { Database } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const WRITER_ROLES = ["learner", "alumni", "preneur"];
const TEAM_SPACE_ROLES = ["learner", "preneur"];
type UserRole = "outsider" | "learner" | "alumni" | "preneur";

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isBlogWriteRoute(pathname: string) {
  return pathname === "/blog/write" || pathname.startsWith("/blog/write/");
}

function isBlogEditRoute(pathname: string) {
  return pathname === "/blog/edit" || pathname.startsWith("/blog/edit/");
}

export function isPrivateProfileRoute(pathname: string) {
  return pathname === "/profile" || pathname === "/profile/edit";
}

function isResetPasswordRoute(pathname: string) {
  return pathname === "/reset-password";
}

function isTeamSpaceRoute(pathname: string) {
  return pathname === "/team-space" || pathname.startsWith("/team-space/");
}

function isTeamBuildingRoute(pathname: string) {
  return pathname === "/team-building-2026" || pathname.startsWith("/team-building-2026/");
}

const BLOCKED_ROUTES = [
  "/demoday",
  "/contact",
  "/cofounder-matching",
  "/faq",
  "/press",
  "/subscribe",
  "/vcc",
];

function isBlockedRoute(pathname: string) {
  return BLOCKED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

async function getUserRole(
  request: NextRequest,
  response: NextResponse,
  userId: string,
): Promise<{ role: UserRole; isAdmin: boolean }> {
  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userId)
    .maybeSingle();

  return {
    role: (profile?.role as UserRole | null) ?? "outsider",
    isAdmin: profile?.is_admin === true,
  };
}

export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;

  if (isBlockedRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const needsAdmin = isAdminRoute(pathname);
  const needsWriter = isBlogWriteRoute(pathname) || isBlogEditRoute(pathname);
  const isApplyRoute = (pathname === "/apply" || pathname.startsWith("/apply/")) &&
                       !pathname.startsWith("/apply/status");
  const needsTeamSpace = isTeamSpaceRoute(pathname) || isTeamBuildingRoute(pathname);
  const needsAuth = isPrivateProfileRoute(pathname) || isResetPasswordRoute(pathname) || isApplyRoute || needsTeamSpace;

  if (!needsAdmin && !needsWriter && !needsAuth) {
    return NextResponse.next({ request });
  }

  const { response, user } = await updateSession(request);

  if (!user) {
    if (needsWriter || needsAuth) {
      return redirectWithCookies(request, response, `/login?redirect=${pathname}`);
    }

    return redirectWithCookies(request, response, "/");
  }

  const { role, isAdmin } = await getUserRole(request, response, user.id);

  if (needsAdmin && role !== "preneur" && !isAdmin) {
    return redirectWithCookies(request, response, "/");
  }

  if (needsWriter && !WRITER_ROLES.includes(role)) {
    return redirectWithCookies(request, response, "/");
  }

  if (needsTeamSpace && !TEAM_SPACE_ROLES.includes(role) && !isAdmin) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|tiff|woff|woff2|ttf|eot|otf|css|js|map)$).*)",
  ],
};
