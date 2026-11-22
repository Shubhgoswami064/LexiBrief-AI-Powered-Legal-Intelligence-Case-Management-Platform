"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "../components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const notice =
    params.get("reset") === "1"
      ? "Password changed. Sign in with your new password."
      : params.get("verified") === "1"
      ? "Email verified. Sign in with your password."
      : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Email or password is incorrect, or the email isn't verified yet.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use the email and password you registered with."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-ink underline underline-offset-4">
            Create an account
          </Link>
          <p className="mt-2">
            Haven&apos;t verified your email? Create the account again with the same email to get a
            new code.
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {notice && (
          <p
            role="status"
            className="border-l-[3px] border-verdigris bg-white px-3 py-2 text-sm text-verdigris"
          >
            {notice}
          </p>
        )}
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
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Link
            href="/forgot-password"
            className="mt-1.5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            Forgot password?
          </Link>
        </label>
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}