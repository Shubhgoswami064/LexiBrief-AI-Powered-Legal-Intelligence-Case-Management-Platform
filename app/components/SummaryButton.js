"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SummaryButton({ judgmentId, hasSummary }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    setPending(true);
    const res = await fetch(`/api/judgments/${judgmentId}/summarize`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not create the summary.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && (
        <p role="alert" className="notice-error mb-3">
          {error}
        </p>
      )}
      <button onClick={run} disabled={pending} className="btn-primary">
        {pending ? "Writing summary…" : hasSummary ? "Regenerate summary" : "Generate summary"}
      </button>
    </div>
  );
}