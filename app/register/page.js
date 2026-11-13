"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "../components/AuthShell";
import OtpForm from "../components/OtpForm";

const ROLES = [
  ["LAWYER", "Lawyer"],
  ["OFFICIAL", "Court official"],
];

export default function RegisterPage() {
  const [step, setStep] = useState("details");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "LAWYER" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    const email = form.email.trim().toLowerCase();

    const reg = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, email }),
    });
    const regData = await reg.json();
    if (!reg.ok) {
      setPending(false);
      setError(regData.error || "Could not create the account. Try again.");
      return;
    }

    const send = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setPending(false);
    if (!send.ok) {
      const sendData = await send.json();
      setError(sendData.error || "Could not send the verification code. Try again.");
      return;
    }

    setForm({ ...form, email });
    setStep("code");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        step === "details"
          ? "We'll email a code to confirm your address."
          : `We sent a 6-digit code to ${form.email}. Enter it to verify your email.`
      }
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      {step === "details" ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p role="alert" className="notice-error">
              {error}
            </p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Full name</span>
            <input
              className="field"
              autoComplete="name"
              value={form.name}
              onChange={set("name")}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email</span>
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              minLength={8}
              required
            />
            <span className="mt-1.5 block text-xs text-muted">At least 8 characters.</span>
          </label>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">I am a</legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={form.role === value}
                    onChange={set("role")}
                    className="peer sr-only"
                  />
                  <span className="block rounded-md border border-rule bg-white px-3 py-2 text-center text-sm transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brass">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account and send code"}
          </button>
        </form>
      ) : (
        <OtpForm email={form.email} onBack={() => setStep("details")} />
      )}
    </AuthShell>
  );
}