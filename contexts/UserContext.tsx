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

    let active = true;
    let loadedUserId: string | null | undefined;

    async function loadProfile(currentUser: User | null, force = false) {
      const nextUserId = currentUser?.id ?? null;
      setUser(currentUser);

      // Token refreshes re-emit the same user; skip the profiles refetch.
      if (!force && nextUserId === loadedUserId) {
        setIsLoading(false);
        return;
      }
      loadedUserId = nextUserId;

      if (!currentUser) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!active || loadedUserId !== currentUser.id) return;
      setProfile(currentProfile ?? null);
      setIsLoading(false);
    }

    // Session is read from local storage/cookies (no network round-trip);
    // the server re-verifies on every protected request.
    fetchRef.current = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await loadProfile(session?.user ?? null, true);
    };

    // onAuthStateChange emits INITIAL_SESSION on subscribe, so no separate
    // initial fetch is needed. Supabase calls are deferred out of the callback
    // because awaiting them inside it can block the auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const force = event === "USER_UPDATED";
      setTimeout(() => {
        if (active) void loadProfile(session?.user ?? null, force);
      }, 0);
    });

    return () => {
      active = false;
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
