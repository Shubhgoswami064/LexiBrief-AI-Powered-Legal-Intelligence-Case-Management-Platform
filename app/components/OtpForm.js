"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OtpForm({ email, onBack }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: code }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not verify the code. Try again.");
      return;
    }
    router.push("/login?verified=1");
  }

  async function resend() {
    setError("");
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not send a new code.");
      return;
    }
    setCode("");
    setCooldown(60);
  }

  return (
    <form onSubmit={verify} className="space-y-5">
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

      <button className="btn-primary w-full" disabled={pending || code.length !== 6}>
        {pending ? "Verifying…" : "Verify email"}
      </button>

      <div className="flex items-center justify-between text-sm text-muted">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="underline underline-offset-4 disabled:no-underline disabled:opacity-60"
        >
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </button>
        <button type="button" onClick={onBack} className="underline underline-offset-4">
          Change details
        </button>
      </div>
    </form>
  );
}