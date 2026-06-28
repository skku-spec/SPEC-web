import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/types";

export type SessionClaims = {
  sub?: string;
  email?: string;
  user_role?: string;
  role?: string;
  is_admin?: boolean;
  [key: string]: unknown;
} | null;

type SessionResult = {
  response: NextResponse;
  claims: SessionClaims;
};

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { response: NextResponse.next({ request }), claims: null };
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() verifies the JWT locally when asymmetric signing keys are
  // enabled (no network round-trip), and only falls back to a network call
  // otherwise — a safe drop-in replacement for the always-remote getUser().
  const { data } = await supabase.auth.getClaims();

  return { response, claims: (data?.claims ?? null) as SessionClaims };
}
