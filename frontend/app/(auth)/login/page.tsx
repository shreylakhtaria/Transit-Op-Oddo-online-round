"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AtSign,
  Eye,
  EyeOff,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  LogIn,
  Route,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { login, tokenStore, verifyOtp } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

// The four roles the backend actually seeds. The mockup showed a "Dispatcher",
// which does not exist — the real fourth role is Driver.
const ROLES = [
  { label: "Fleet Manager", icon: LayoutGrid },
  { label: "Driver", icon: Route },
  { label: "Safety Officer", icon: ShieldCheck },
  { label: "Financial Analyst", icon: Wallet },
] as const;

/** Field label with a leading glyph — local to the auth screen. */
function AuthLabel({
  htmlFor,
  icon,
  children,
}: {
  htmlFor: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2">
      <span className="text-muted">{icon}</span>
      <span className="label-field uppercase">{children}</span>
    </label>
  );
}

const CONTROL =
  "w-full rounded-t-sm border border-line bg-surface-2 px-3 py-3 text-base text-ink backdrop-blur-[16px] outline-none placeholder:text-placeholder focus:border-accent/45 focus:shadow-[0_0_24px_rgba(125,211,252,0.15)]";

export default function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const otpId = useId();
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  // The API is two-step: credentials earn a 5-minute tempToken and trigger an
  // OTP; only the code exchanges it for real JWTs. Same card, two stages.
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { tempToken } = await login(email, password);
      setTempToken(tempToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!tempToken) return;
    setPending(true);
    setError(null);
    try {
      const { accessToken, refreshToken } = await verifyOtp(tempToken, code);
      tokenStore.set(accessToken, refreshToken);
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 items-stretch">
        {/* Left — brand & context */}
        <section className="hidden flex-1 flex-col justify-between overflow-hidden p-8 lg:flex">
          <div className="flex flex-col gap-12">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg border border-accent/40 bg-accent/20 shadow-[0_0_24px_rgba(125,211,252,0.15)]">
                <Truck className="size-6 text-accent" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-semibold leading-8 tracking-[-0.6px] text-ink">
                  TransitOps
                </h1>
                <span className="label-field uppercase text-accent">
                  Mission Control
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-md flex-col gap-4">
              <h2 className="text-5xl font-bold leading-[60px] tracking-[-0.96px] text-ink">
                Smart Transport Operations Platform
              </h2>
              <p className="text-base leading-6 text-muted">
                Real-time logistics, fleet telemetry, and automated dispatch
                management for high-stakes transportation networks.
              </p>
            </div>
          </div>

          <ul className="grid w-full max-w-md grid-cols-2 gap-4">
            {ROLES.map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="glass flex h-[58px] items-center gap-3 rounded-lg px-4"
              >
                <Icon className="size-[18px] shrink-0 text-accent" />
                <span className="text-sm text-ink">{label}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-4 pt-8 opacity-30">
            <div className="h-px w-full bg-line" />
            <p className="label-field text-ink">
              SYSTEM OPERATIONAL STATUS: NOMINAL
            </p>
          </div>
        </section>

        {/* Right — authentication form */}
        <section className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-2 pb-10">
              <h3 className="text-xl font-semibold leading-7 text-ink">
                {tempToken ? "Verify Identity" : "Secure Access"}
              </h3>
              <p className="text-sm leading-5 text-muted">
                {tempToken
                  ? `We sent a 6-digit code to ${email}. Enter it to continue.`
                  : "Enter your operational credentials to continue."}
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-danger/30 bg-danger-dim px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {tempToken ? (
              <form className="flex flex-col gap-6" onSubmit={handleOtp}>
                <div className="flex flex-col gap-2">
                  <AuthLabel htmlFor={otpId} icon={<KeyRound className="size-3" />}>
                    Verification Code
                  </AuthLabel>
                  <input
                    id={otpId}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className={`${CONTROL} text-center font-mono text-2xl tracking-[0.5em]`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending || code.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 py-4 text-sm font-bold text-accent backdrop-blur-[16px] transition hover:bg-accent/25 hover:shadow-[0_0_24px_rgba(125,211,252,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? (
                    <Loader2 className="size-[18px] animate-spin" />
                  ) : (
                    <ShieldCheck className="size-[18px]" />
                  )}
                  {pending ? "Verifying…" : "Verify & Continue"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTempToken(null);
                    setCode("");
                    setError(null);
                  }}
                  className="text-center text-sm text-muted transition hover:text-accent"
                >
                  ← Use a different account
                </button>
              </form>
            ) : (
              <form className="flex flex-col gap-6" onSubmit={handleCredentials}>
                <div className="flex flex-col gap-2">
                <AuthLabel htmlFor={emailId} icon={<AtSign className="size-3" />}>
                  Email Address
                </AuthLabel>
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@transitops.com"
                  className={CONTROL}
                />
              </div>

              <div className="flex flex-col gap-2">
                <AuthLabel htmlFor={passwordId} icon={<Lock className="size-3" />}>
                  Operator Password
                </AuthLabel>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`${CONTROL} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-placeholder transition hover:text-muted"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* The design had a "Role (RBAC)" picker here. It's removed on purpose:
                  POST /auth/login takes only email + password, and your role comes from
                  your account. A picker would imply you can choose your own privileges. */}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember((v) => !v)}
                  className="flex items-center gap-2"
                >
                  <span className="flex size-4 items-center justify-center rounded border border-line p-px">
                    <span
                      className={`size-2 rounded-[2px] bg-accent transition-opacity ${
                        remember ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </span>
                  <span className="text-sm text-muted">Remember me</span>
                </button>
                <a href="#" className="text-sm font-medium text-accent hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 py-4 text-sm font-bold text-accent backdrop-blur-[16px] transition hover:bg-accent/25 hover:shadow-[0_0_24px_rgba(125,211,252,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? (
                  <Loader2 className="size-[18px] animate-spin" />
                ) : (
                  <LogIn className="size-[18px]" />
                )}
                {pending ? "Signing in…" : "Sign In"}
              </button>
              </form>
            )}

            <p className="pt-12 text-center text-sm text-muted">
              Trouble logging in?{" "}
              <Link href="/support" className="text-accent hover:underline">
                Contact TransitOps Support
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="flex h-16 w-full items-center justify-between border-t border-line-soft bg-surface px-8 backdrop-blur-[16px]">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[13px] font-medium leading-4 text-muted opacity-60">
            TRANSITOPS © 2026
          </span>
          <span className="h-4 w-px bg-line opacity-30" />
          <span className="flex items-center gap-1.5 rounded border border-line-soft bg-accent-faint px-2.5 py-0.5">
            <ShieldCheck className="size-2.5 shrink-0 text-muted" />
            <span className="text-[10px] leading-5 tracking-[1px] text-muted">
              RBAC ENABLED
            </span>
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/privacy" className="label-field hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/security-audit" className="label-field hover:text-ink">
            Security Audit
          </Link>
          <span className="label-field">v2.4.1</span>
        </nav>
      </footer>
    </div>
  );
}
