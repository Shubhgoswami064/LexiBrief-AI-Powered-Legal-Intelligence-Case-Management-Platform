import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import prisma from "../../lib/prisma";
import Sidebar from "../components/Sidebar";

const ROLE_LABEL = {
  LAWYER: "Lawyer",
  OFFICIAL: "Court official",
  ADMIN: "Administrator",
};
const TZ = "Asia/Kolkata";
const STATUSES = ["READY", "PROCESSING", "FAILED"];
const SEARCH_FIELDS = ["title", "caseNumber", "court", "parties", "summary", "outcome", "fullText"];

function StatusPill({ status }) {
  const map = {
    READY: { label: "Ready", text: "text-verdigris", dot: "bg-verdigris" },
    PROCESSING: { label: "Processing", text: "text-brass", dot: "bg-brass animate-pulse" },
    FAILED: { label: "Failed", text: "text-danger", dot: "bg-danger" },
  };
  const s = map[status] || map.PROCESSING;
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Highlight({ text, q }) {
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp("(" + escaped + ")", "i"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-brass-soft/60 px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function snippetFor(fullText, q) {
  if (!fullText || !q) return null;
  const index = fullText.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return null;
  const start = Math.max(0, index - 70);
  const end = Math.min(fullText.length, index + q.length + 110);
  const piece = fullText.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${piece}${end < fullText.length ? "…" : ""}`;
}

export default async function JudgmentsPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const q = (typeof sp?.q === "string" ? sp.q : "").trim().slice(0, 100);
  const status = STATUSES.includes(sp?.status) ? sp.status : "";

  const where = {
    userId: session.user.id,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: SEARCH_FIELDS.map((field) => ({
            [field]: { contains: q, mode: "insensitive" },
          })),
        }
      : {}),
  };

  const items = await prisma.judgment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      caseNumber: true,
      court: true,
      parties: true,
      summary: true,
      status: true,
      createdAt: true,
      fullText: Boolean(q),
    },
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar
        name={session.user.name || session.user.email}
        roleLabel={ROLE_LABEL[session.user.role] || "Lawyer"}
      />

      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl">All judgments</h1>
            <p className="mt-2 text-muted">
              Search by title, parties, court, summary, or anything in the judgment text.
            </p>
          </div>
          <Link href="/upload" className="btn-primary">
            Upload judgment
          </Link>
        </header>

        <form method="GET" className="mt-8 flex max-w-3xl flex-wrap gap-3">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search judgments</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search, for example bail, कब्जा, Section 438"
              className="field"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <select name="status" defaultValue={status} className="field">
              <option value="">All statuses</option>
              <option value="READY">Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </label>
          <button className="btn-primary">Search</button>
          {(q || status) && (
            <Link href="/judgments" className="self-center text-sm text-muted underline underline-offset-4">
              Clear
            </Link>
          )}
        </form>

        <p className="mt-6 text-sm text-muted">
          {items.length === 0
            ? "No judgments match."
            : `${items.length} ${items.length === 1 ? "judgment" : "judgments"}${
                items.length === 30 ? " (showing the latest 30)" : ""
              }`}
        </p>

        {items.length === 0 ? (
          <div className="mt-4 max-w-3xl rounded-lg border border-dashed border-rule bg-white/60 px-6 py-12 text-center">
            <p className="font-serif text-lg">{q || status ? "Nothing found" : "No judgments yet"}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              {q || status
                ? "Try a different word, or clear the filters."
                : "Upload a PDF to see it here."}
            </p>
          </div>
        ) : (
          <ul className="mt-2 max-w-3xl divide-y divide-rule border-y border-rule">
            {items.map((j) => {
              const snippet = snippetFor(j.fullText, q);
              const meta = [j.caseNumber, j.court].filter(Boolean).join(", ");
              return (
                <li key={j.id}>
                  <Link href={`/judgments/${j.id}`} className="block py-5 transition hover:bg-white/70">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          <Highlight text={j.title} q={q} />
                        </p>
                        {j.parties && (
                          <p className="mt-0.5 text-sm">
                            <Highlight text={j.parties} q={q} />
                          </p>
                        )}
                        <p className="mt-0.5 text-sm text-muted">
                          {[meta, j.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TZ })]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <StatusPill status={j.status} />
                    </div>

                    {j.summary && (
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/80">
                        <Highlight text={j.summary.slice(0, 220)} q={q} />
                      </p>
                    )}
                    {snippet && (
                      <p className="mt-2 border-l-2 border-brass pl-3 text-sm leading-relaxed text-muted">
                        <Highlight text={snippet} q={q} />
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}