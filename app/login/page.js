"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "../components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setVerified(new URLSearchParams(window.location.search).get("verified") === "1");
  }, []);

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
        {verified && (
          <p
            role="status"
            className="border-l-[3px] border-verdigris bg-white px-3 py-2 text-sm text-verdigris"
          >
            Email verified. Sign in with your password.
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
        </label>
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}