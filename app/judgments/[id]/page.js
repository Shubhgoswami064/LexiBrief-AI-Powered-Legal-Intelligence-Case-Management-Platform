import { notFound, redirect } from "next/navigation";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import Sidebar from "../../components/Sidebar";
import SummaryButton from "../../components/SummaryButton";

const ROLE_LABEL = {
  LAWYER: "Lawyer",
  OFFICIAL: "Court official",
  ADMIN: "Administrator",
};
const TZ = "Asia/Kolkata";
const PREVIEW_CHARS = 6000;

function formatDate(date, opts) {
  return new Date(date).toLocaleDateString("en-IN", { timeZone: TZ, ...opts });
}

export default async function JudgmentPage({ params }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const j = await prisma.judgment.findUnique({
    where: { id },
    include: {
      citations: { orderBy: { text: "asc" } },
      hearings: { orderBy: { date: "asc" } },
    },
  });
  if (!j || j.userId !== session.user.id) notFound();

  const words = j.fullText ? j.fullText.split(/\s+/).filter(Boolean).length : 0;
  const preview = j.fullText ? j.fullText.slice(0, PREVIEW_CHARS) : "";
  const keyPoints = Array.isArray(j.keyPoints) ? j.keyPoints : [];
  const hasSummary = Boolean(j.summary);

  const stats = [
    { label: "Pages", value: j.pageCount ?? "-" },
    { label: "Words", value: words ? words.toLocaleString("en-IN") : "-" },
    {
      label: "Uploaded",
      value: formatDate(j.createdAt, { day: "numeric", month: "short", year: "numeric" }),
    },
  ];

  const meta = [j.caseNumber, j.court, j.language].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar
        name={session.user.name || session.user.email}
        roleLabel={ROLE_LABEL[session.user.role] || "Lawyer"}
      />

      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-3xl">{j.title}</h1>
            {j.parties && <p className="mt-2 text-ink">{j.parties}</p>}
            <p className="mt-1 text-muted">{meta || "No case details added"}</p>
          </div>
          <a
            href={j.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Open original PDF
          </a>
        </header>

        <dl className="mt-8 grid grid-cols-3 border-y border-rule">
          {stats.map((s) => (
            <div key={s.label} className="border-l border-rule px-4 py-5 first:border-l-0 lg:px-6">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-1 font-serif text-2xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        {j.status === "FAILED" && (
          <p role="alert" className="notice-error mt-8">
            {j.errorMessage || "This judgment could not be processed."}
          </p>
        )}

        {j.fullText && (
          <section className="mt-10 max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-2xl">Summary</h2>
              <SummaryButton judgmentId={j.id} hasSummary={hasSummary} />
            </div>

            {hasSummary ? (
              <>
                <p className="mt-4 text-lg leading-relaxed">{j.summary}</p>

                {j.outcome && (
                  <p className="mt-6 border-l-[3px] border-brass pl-4">
                    <span className="block text-sm text-muted">Outcome</span>
                    {j.outcome}
                  </p>
                )}

                {keyPoints.length > 0 && (
                  <div className="mt-10">
                    <h3 className="font-serif text-xl">Key legal points</h3>
                    <ol className="mt-4 list-decimal space-y-3 pl-5 marker:text-brass">
                      {keyPoints.map((p, i) => (
                        <li key={i} className="pl-1 leading-relaxed">
                          {p}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="mt-10">
                  <h3 className="font-serif text-xl">Citations</h3>
                  {j.citations.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">No citations found in this judgment.</p>
                  ) : (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {j.citations.map((c) => (
                        <li
                          key={c.id}
                          className="rounded border border-rule bg-white px-2.5 py-1 text-sm"
                        >
                          {c.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-10">
                  <h3 className="font-serif text-xl">Hearings</h3>
                  {j.hearings.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">
                      No upcoming hearing was mentioned in this judgment.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {j.hearings.map((h) => (
                        <li key={h.id}>
                          <span className="font-medium">
                            {formatDate(h.date, { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                          {h.purpose && <span className="text-muted">, {h.purpose}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="mt-10 text-sm text-muted">
                  AI-generated. Check the summary and citations against the original judgment before
                  relying on them.
                </p>
              </>
            ) : (
              <p className="mt-4 text-muted">
                No summary yet. Click Generate summary to create one from the extracted text.
              </p>
            )}
          </section>
        )}

        {preview && (
          <details className="mt-12 max-w-3xl">
            <summary className="cursor-pointer font-serif text-xl">Extracted text</summary>
            <pre className="mt-4 max-h-[32rem] overflow-y-auto whitespace-pre-wrap border border-rule bg-white p-6 font-sans text-sm leading-relaxed">
              {preview}
            </pre>
            {j.fullText.length > PREVIEW_CHARS && (
              <p className="mt-2 text-sm text-muted">
                Showing the first {PREVIEW_CHARS.toLocaleString("en-IN")} characters.
              </p>
            )}
          </details>
        )}
      </main>
    </div>
  );
}