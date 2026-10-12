import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

type SessionResult = {
  response: NextResponse;
  userId: string | null;
  supabase: SupabaseClient<Database> | null;
};

export async function updateSession(request: NextRequest): Promise<SessionResult> {
  if (!hasSupabasePublicEnv()) {
    return { response: NextResponse.next({ request }), userId: null, supabase: null };
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv();
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
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
  // enabled and only falls back to a network call otherwise, so it is never
  // slower than the always-remote getUser(). It still refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  return { response, userId, supabase };
}
