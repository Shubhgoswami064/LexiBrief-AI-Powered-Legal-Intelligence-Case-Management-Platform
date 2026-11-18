"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ judgmentId }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm("Delete this judgment and its summary? This cannot be undone.")) return;
    setError("");
    setPending(true);
    const res = await fetch(`/api/judgments/${judgmentId}`, { method: "DELETE" });
    if (!res.ok) {
      setPending(false);
      setError("Could not delete. Try again.");
      return;
    }
    router.push("/judgments");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="rounded-md border border-rule bg-white px-4 py-2.5 text-sm text-danger transition hover:border-danger disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}