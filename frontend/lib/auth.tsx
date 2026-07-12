"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, tokenStore } from "./api/client";
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
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<{ user: AuthUser }>("/auth/me"),
    enabled: hasToken === true,
    retry: false,
    staleTime: 5 * 60_000,
  });

  // Only a rejected token means "signed out". A 500 or a dropped connection is
  // transient — bouncing the user to /login over it would lose their place and
  // their work. Keep them in the console; each page surfaces its own error state.
  const rejected = isError && error instanceof ApiError && error.status === 401;

  const isAuthenticated =
    hasToken === null
      ? null
      : hasToken === false || rejected
        ? false
        : isPending
          ? null
          : true;

  const refreshUser = useCallback(async () => {
    setHasToken(Boolean(tokenStore.access));
    await qc.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [qc]);

  const logout = useCallback(() => {
    // Revoke server-side so the 7-day refresh token can't be replayed. Best-effort:
    // a failure here must not strand the user in a session they asked to leave.
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      void api.post("/auth/logout", { refreshToken }).catch(() => {});
    }
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
