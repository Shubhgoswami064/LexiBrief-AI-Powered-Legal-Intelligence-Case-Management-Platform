"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { istDayRange, toDateInputValue } from "../../lib/ist";

const TZ = "Asia/Kolkata";

function fmt(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export default function HearingManager({ judgmentId, hearings }) {
  const router = useRouter();
  const [add, setAdd] = useState({ date: "", purpose: "" });
  const [edit, setEdit] = useState(null); // { id, date, purpose }
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const todayStart = istDayRange(0).start.getTime();
  const upcoming = hearings.filter((h) => new Date(h.date).getTime() >= todayStart);
  const past = hearings.filter((h) => new Date(h.date).getTime() < todayStart).reverse();

  async function call(url, method, body) {
    setError("");
    setPending(true);
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong. Try again.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function addHearing(e) {
    e.preventDefault();
    const ok = await call(`/api/judgments/${judgmentId}/hearings`, "POST", add);
    if (ok) setAdd({ date: "", purpose: "" });
  }

  async function saveEdit(e) {
    e.preventDefault();
    const ok = await call(`/api/hearings/${edit.id}`, "PATCH", {
      date: edit.date,
      purpose: edit.purpose,
    });
    if (ok) setEdit(null);
  }

  async function remove(id) {
    if (!window.confirm("Remove this hearing?")) return;
    await call(`/api/hearings/${id}`, "DELETE");
  }

  function renderRow(h) {
    return (
      <li key={h.id} className="border-b border-rule pb-3">
        {edit?.id === h.id ? (
          <form onSubmit={saveEdit} className="space-y-2">
            <input
              type="date"
              className="field"
              value={edit.date}
              onChange={(e) => setEdit({ ...edit, date: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Purpose (optional)"
              maxLength={200}
              value={edit.purpose}
              onChange={(e) => setEdit({ ...edit, purpose: e.target.value })}
            />
            <div className="flex items-center gap-4 text-sm">
              <button className="btn-primary" disabled={pending}>
                Save
              </button>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="text-muted underline underline-offset-4"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="font-medium">{fmt(h.date)}</p>
            {h.purpose && <p className="text-sm text-muted">{h.purpose}</p>}
            <div className="mt-1 flex gap-4 text-sm">
              <button
                type="button"
                onClick={() =>
                  setEdit({
                    id: h.id,
                    date: toDateInputValue(new Date(h.date)),
                    purpose: h.purpose || "",
                  })
                }
                className="text-muted underline underline-offset-4 hover:text-ink"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(h.id)}
                className="text-danger underline underline-offset-4"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </li>
    );
  }

  return (
    <div>
      <h3 className="font-serif text-xl">Hearings</h3>

      {error && (
        <p role="alert" className="notice-error mt-3">
          {error}
        </p>
      )}

      {upcoming.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No upcoming hearing recorded.</p>
      ) : (
        <ul className="mt-4 space-y-3">{upcoming.map(renderRow)}</ul>
      )}

      {past.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Past hearings ({past.length})</summary>
          <ul className="mt-3 space-y-3">{past.map(renderRow)}</ul>
        </details>
      )}

      <form onSubmit={addHearing} className="mt-6 space-y-2 border-t border-rule pt-4">
        <p className="text-sm font-medium">Add a hearing</p>
        <label className="block">
          <span className="sr-only">Hearing date</span>
          <input
            type="date"
            className="field"
            value={add.date}
            onChange={(e) => setAdd({ ...add, date: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="sr-only">Purpose</span>
          <input
            className="field"
            placeholder="Purpose (optional), e.g. final arguments"
            maxLength={200}
            value={add.purpose}
            onChange={(e) => setAdd({ ...add, purpose: e.target.value })}
          />
        </label>
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Add hearing"}
        </button>
        <p className="text-xs text-muted">You get an email the day before.</p>
      </form>
    </div>
  );
}