"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "../components/AuthShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e) {
    if (e) e.preventDefault();
    setError("");
    setPending(true);
    const clean = email.trim().toLowerCase();
    const res = await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: clean }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not send the code. Try again.");
      return;
    }
    setEmail(clean);
    setStep("reset");
    setCooldown(60);
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    const res = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code, password }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not reset the password. Try again.");
      return;
    }
    router.push("/login?reset=1");
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={
        step === "email"
          ? "Enter your email and we'll send you a 6-digit code."
          : `If an account exists for ${email}, a code is on its way. Enter it with your new password.`
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        </>
      }
    >
      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-5">
          {error && (
            <p role="alert" className="notice-error">
              {error}
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-5">
          {error && (
            <p role="alert" className="notice-error">
              {error}
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">6-digit code</span>
            <input
              className="field text-center font-serif text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">New password</span>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <span className="mt-1.5 block text-xs text-muted">At least 8 characters.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>

          <button className="btn-primary w-full" disabled={pending || code.length !== 6}>
            {pending ? "Saving…" : "Change password"}
          </button>

          <div className="flex items-center justify-between text-sm text-muted">
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={cooldown > 0 || pending}
              className="underline underline-offset-4 disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
                setCode("");
              }}
              className="underline underline-offset-4"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}