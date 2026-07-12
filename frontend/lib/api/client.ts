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

async function readError(res: Response) {
  try {
    const body = await res.json();
    return body?.message ?? body?.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/**
 * Access tokens live 15 minutes, so a long-lived tab will hit 401 mid-session.
 * On the first 401 we spend the refresh token and replay the request once;
 * a second failure means the session is genuinely dead.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const { accessToken } = (await res.json()) as { accessToken: string };
  tokenStore.set(accessToken);
  return accessToken;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenStore.access;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
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
    throw new ApiError(401, "Session expired. Please sign in again.");
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
