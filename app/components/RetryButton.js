"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RetryButton({ judgmentId }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function retry() {
    setError("");
    setPending(true);
    const res = await fetch(`/api/judgments/${judgmentId}/process`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not read this PDF.");
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      <button type="button" onClick={retry} disabled={pending} className="btn-primary">
        {pending ? "Reading the pages…" : "Retry reading"}
      </button>
      {pending && (
        <p className="mt-2 text-sm text-muted">Scanned files can take a minute. Keep this page open.</p>
      )}
    </div>
  );
}