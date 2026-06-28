"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";

import { normalizeRole, type UserRole } from "@/lib/auth-shared";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type UserContextValue = {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const supabase = createClient();

    async function fetchUser() {
      // getClaims() verifies the JWT locally when signing keys are enabled,
      // avoiding a network round-trip on every page mount. Context consumers
      // only read user.id / user.email, so claims cover what they need.
      const { data } = await supabase.auth.getClaims();
      const claims = data?.claims ?? null;

      if (!claims?.sub) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setUser({ id: claims.sub, email: claims.email } as unknown as User);

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", claims.sub)
        .maybeSingle();

      setProfile(currentProfile ?? null);
      setIsLoading(false);
    }

    fetchRef.current = fetchUser;
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      profile,
      role: normalizeRole(profile?.role),
      isLoading,
      isAuthenticated: Boolean(user),
      refreshUser: async () => { await fetchRef.current?.(); },
    }),
    [user, profile, isLoading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
}
