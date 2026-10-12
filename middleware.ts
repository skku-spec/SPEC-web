import { NextResponse, type NextRequest } from "next/server";

import { BLOG_WRITER_ROLES, TEAM_SPACE_ROLES, normalizeRole, type UserRole } from "@/lib/auth-shared";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";

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
  return pathname === "/profile" ||
         pathname === "/profile/edit" ||
         pathname === "/dashboard" ||
         pathname.startsWith("/dashboard/");
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

export async function middleware(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
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

  const { response, userId, supabase } = await updateSession(request);

  if (!userId || !supabase) {
    if (needsWriter || needsAuth) {
      const redirectTarget = pathname === "/dashboard" || pathname.startsWith("/dashboard/")
        ? `${pathname}${request.nextUrl.search}`
        : pathname;
      const redirectParam = redirectTarget === pathname ? pathname : encodeURIComponent(redirectTarget);
      return redirectWithCookies(request, response, `/login?redirect=${redirectParam}`);
    }

    return redirectWithCookies(request, response, "/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", userId)
    .maybeSingle();
  const role: UserRole = normalizeRole(profile?.role);
  const isAdmin = profile?.is_admin === true;

  if (needsAdmin && role !== "preneur" && !isAdmin) {
    return redirectWithCookies(request, response, "/");
  }

  if (needsWriter && !BLOG_WRITER_ROLES.includes(role)) {
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
