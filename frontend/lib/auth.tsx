"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, tokenStore } from "./api/client";
import type { AuthUser } from "./api/types";

type AuthState = {
  user: AuthUser | null;
  /** null while the session is still being resolved on first paint. */
  isAuthenticated: boolean | null;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();

  // Read the token once on mount. localStorage is unavailable during SSR, so
  // this stays null on the server and resolves on the client's first render.
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  if (hasToken === null && typeof window !== "undefined") {
    setHasToken(Boolean(tokenStore.access));
  }

  // Validating the token IS a query — let React Query own the async state
  // rather than syncing it into local state from an effect.
  const { data, isPending, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<{ user: AuthUser }>("/auth/me"),
    enabled: hasToken === true,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const isAuthenticated =
    hasToken === null ? null : hasToken === false || isError ? false : isPending ? null : true;

  const refreshUser = useCallback(async () => {
    setHasToken(Boolean(tokenStore.access));
    await qc.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [qc]);

  const logout = useCallback(() => {
    tokenStore.clear();
    qc.clear();
    setHasToken(false);
    router.push("/login");
  }, [qc, router]);

  const value = useMemo(
    () => ({
      user: data?.user ?? null,
      isAuthenticated,
      logout,
      refreshUser,
    }),
    [data, isAuthenticated, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
