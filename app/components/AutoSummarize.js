"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoSummarize({ judgmentId }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);

  async function run() {
    setError("");
    setRunning(true);
    setSeconds(0);
    const res = await fetch(`/api/judgments/${judgmentId}/summarize`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRunning(false);
      setError(data.error || "Could not create the summary.");
      return;
    }
    router.refresh();
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (error) {
    return (
      <div className="mt-4">
        <p role="alert" className="notice-error">
          {error}
        </p>
        <button onClick={run} className="btn-primary mt-4">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4" role="status" aria-live="polite">
      <div className="animate-pulse space-y-3" aria-hidden="true">
        <div className="h-3.5 w-full rounded bg-rule" />
        <div className="h-3.5 w-[92%] rounded bg-rule" />
        <div className="h-3.5 w-[96%] rounded bg-rule" />
        <div className="h-3.5 w-[70%] rounded bg-rule" />
      </div>
      <p className="mt-4 text-sm text-muted">
        Writing the summary… {seconds}s. Long judgments can take a minute, so keep this page open.
      </p>
    </div>
  );
}