function readSupabasePublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasSupabasePublicEnv() {
  const { supabaseUrl, supabasePublishableKey } = readSupabasePublicEnv();
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabasePublicEnv() {
  const { supabaseUrl, supabasePublishableKey } = readSupabasePublicEnv();

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}
