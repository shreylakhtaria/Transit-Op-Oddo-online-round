import type { LoginResponse, VerifyOtpResponse } from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const ACCESS_KEY = "transitops.accessToken";
const REFRESH_KEY = "transitops.refreshToken";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The session is genuinely over — the refresh token itself was rejected. */
export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, "Session expired. Please sign in again.");
    this.name = "SessionExpiredError";
  }
}

async function readError(res: Response) {
  try {
    const body = await res.json();
    return body?.message ?? body?.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/**
 * Access tokens live 15 minutes, so a long-lived tab reliably hits 401 mid-session.
 *
 * Two things this has to get right:
 *
 * 1. **Single-flight.** A page mounts several queries at once, so an expired token
 *    produces N simultaneous 401s. Without deduping, each spawns its own refresh.
 *    That works today only because the backend does not rotate refresh tokens — the
 *    day it starts to (standard hardening), every refresh but the first would be
 *    rejected and users would be logged out at random. Collapse them into one call.
 *
 * 2. **Only a rejected refresh token ends the session.** A 500 or a backend restart
 *    is transient; destroying the session over it means a blip logs the user out.
 *    Clear tokens on 401/403 from /auth/refresh, and only then.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  // The refresh token itself was refused — nothing left to salvage.
  if (res.status === 401 || res.status === 403) return null;

  // Anything else (5xx, gateway hiccup) is transient. Surface it, but keep the
  // session so the user can retry instead of being bounced to the login screen.
  if (!res.ok) throw new ApiError(res.status, await readError(res));

  const { accessToken } = (await res.json()) as { accessToken: string };
  tokenStore.set(accessToken);
  return accessToken;
}

function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenStore.access;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    // Responses vary by Authorization but the API doesn't send `Vary: Authorization`,
    // so letting the browser cache them risks serving one session's data to another.
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry) {
    const fresh = await refreshAccessToken();
    if (fresh) return request<T>(path, init, false);
    tokenStore.clear();
    throw new SessionExpiredError();
  }

  if (!res.ok) throw new ApiError(res.status, await readError(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Step 1 of login — triggers the OTP. Returns a 5-minute tempToken. */
export const login = (email: string, password: string) =>
  api.post<LoginResponse>("/auth/login", { email, password });

/** Step 2 — exchanges tempToken + the 6-digit code for real JWTs. */
export const verifyOtp = (tempToken: string, code: string) =>
  api.post<VerifyOtpResponse>("/auth/verify-otp", { tempToken, code });
