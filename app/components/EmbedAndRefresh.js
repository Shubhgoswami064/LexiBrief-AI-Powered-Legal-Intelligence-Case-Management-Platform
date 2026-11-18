"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EmbedAndRefresh() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    fetch("/api/judgments/embed-missing", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not compare judgments right now.");
        }
        router.refresh();
      })
      .catch((err) => setError(err.message));
  }, [router]);

  if (error) {
    return <p className="mt-3 text-sm text-muted">{error} Reload the page to try again.</p>;
  }

  return (
    <p className="mt-3 animate-pulse text-sm text-muted" role="status">
      Comparing your judgments…
    </p>
  );
}