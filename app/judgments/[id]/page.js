import { notFound, redirect } from "next/navigation";
import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { istDayRange } from "../../../lib/ist";
import Sidebar from "../../components/Sidebar";
import SummaryButton from "../../components/SummaryButton";
import AutoSummarize from "../../components/AutoSummarize";
import DeleteButton from "../../components/DeleteButton";
import RetryButton from "../../components/RetryButton";
import SimilarJudgments from "../../components/SimilarJudgments";
import HearingManager from "../../components/HearingManager";

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

function isRecent(date) {
  return Date.now() - new Date(date).getTime() < 15 * 60 * 1000;
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
  const contentLang = j.language === "Hindi" ? "hi" : "en";

  const hearings = j.hearings.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    purpose: h.purpose,
  }));
  const todayStart = istDayRange(0).start;
  const nextHearing = j.hearings.find((h) => h.date >= todayStart);

  const glance = [
    { label: "Pages", value: j.pageCount ?? "-" },
    { label: "Words", value: words ? words.toLocaleString("en-IN") : "-" },
    { label: "Citations", value: hasSummary ? j.citations.length : "-" },
    {
      label: "Next hearing",
      value: nextHearing
        ? formatDate(nextHearing.date, { day: "numeric", month: "short", year: "numeric" })
        : "None",
    },
  ];

  const sections = [
    j.fullText && { id: "summary", label: "Summary" },
    hasSummary && keyPoints.length > 0 && { id: "points", label: "Key points" },
    hasSummary && { id: "similar", label: "Similar" },
    { id: "hearings", label: "Hearings" },
    hasSummary && { id: "citations", label: "Citations" },
    preview && { id: "text", label: "Full text" },
  ].filter(Boolean);

  const chips = [j.caseNumber, j.court, j.language].filter(Boolean);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar
        name={session.user.name || session.user.email}
        roleLabel={ROLE_LABEL[session.user.role] || "Lawyer"}
      />

      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <header className="reveal flex flex-wrap items-start justify-between gap-4" style={{ "--i": 0 }}>
          <div className="min-w-0 max-w-3xl">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{j.title}</h1>
            {j.parties && (
              <p lang={contentLang} className="mt-2 text-lg">
                {j.parties}
              </p>
            )}
            <p className="mt-3 flex flex-wrap gap-2 text-sm">
              {chips.length === 0 ? (
                <span className="text-muted">No case details added</span>
              ) : (
                chips.map((c) => (
                  <span key={c} className="rounded border border-rule bg-white px-2.5 py-1">
                    {c}
                  </span>
                ))
              )}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <a
              href={j.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Open original PDF
            </a>
            <DeleteButton judgmentId={j.id} />
          </div>
        </header>

        <dl
          className="reveal mt-8 grid grid-cols-2 gap-px border-y border-rule bg-rule lg:grid-cols-4"
          style={{ "--i": 1 }}
        >
          {glance.map((s) => (
            <div key={s.label} className="bg-paper px-4 py-5 lg:px-6">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-1 font-serif text-2xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        {j.status === "FAILED" && (
          <div className="mt-8">
            <p role="alert" className="notice-error">
              {j.errorMessage || "This judgment could not be processed."}
            </p>
            <div className="mt-4">
              <RetryButton judgmentId={j.id} />
            </div>
          </div>
        )}

        {hasSummary && j.outcome && (
          <div className="reveal mt-8 border-l-4 border-brass bg-white px-6 py-5" style={{ "--i": 2 }}>
            <p className="text-sm text-muted">Outcome</p>
            <p lang={contentLang} className="mt-1 font-serif text-2xl leading-snug">
              {j.outcome}
            </p>
          </div>
        )}

        <nav
          aria-label="Sections"
          className="sticky top-0 z-10 -mx-6 mt-8 overflow-x-auto border-b border-rule bg-paper/90 px-6 backdrop-blur lg:-mx-12 lg:px-12"
        >
          <ul className="flex gap-6 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block whitespace-nowrap border-b-2 border-transparent py-3 text-muted transition hover:border-brass hover:text-ink"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_300px]">
          {j.fullText ? (
            <div className="max-w-3xl">
              <section id="summary" className="scroll-mt-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-serif text-2xl">Summary</h2>
                  {hasSummary && <SummaryButton judgmentId={j.id} hasSummary />}
                </div>

                {hasSummary ? (
                  <p lang={contentLang} className="mt-4 text-lg leading-relaxed">
                    {j.summary}
                  </p>
                ) : isRecent(j.createdAt) ? (
                  <AutoSummarize judgmentId={j.id} />
                ) : (
                  <div className="mt-4">
                    <p className="mb-4 text-muted">No summary yet.</p>
                    <SummaryButton judgmentId={j.id} hasSummary={false} />
                  </div>
                )}
              </section>

              {hasSummary && keyPoints.length > 0 && (
                <section id="points" className="mt-12 scroll-mt-16">
                  <h3 className="font-serif text-2xl">Key legal points</h3>
                  <ol lang={contentLang} className="mt-5 divide-y divide-rule border-y border-rule">
                    {keyPoints.map((p, i) => (
                      <li key={i} className="flex gap-5 py-4">
                        <span className="w-8 shrink-0 font-serif text-2xl leading-none text-brass">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {hasSummary && (
                <div id="similar" className="scroll-mt-16">
                  <SimilarJudgments
                    judgmentId={j.id}
                    userId={session.user.id}
                    citations={j.citations}
                  />
                </div>
              )}

              {hasSummary && (
                <p className="mt-10 text-sm text-muted">
                  AI-generated. Check the summary and citations against the original judgment before
                  relying on them.
                </p>
              )}
            </div>
          ) : (
            <div />
          )}

          <aside className="space-y-10 xl:border-l xl:border-rule xl:pl-8">
            <div id="hearings" className="scroll-mt-16">
              <HearingManager judgmentId={j.id} hearings={hearings} />
            </div>

            {hasSummary && (
              <div id="citations" className="scroll-mt-16">
                <h3 className="font-serif text-xl">
                  Citations{j.citations.length > 0 ? ` (${j.citations.length})` : ""}
                </h3>
                {j.citations.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No citations found in this judgment.</p>
                ) : (
                  <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                    {j.citations.map((c) => (
                      <li
                        key={c.id}
                        className="rounded border border-rule bg-white px-2.5 py-1.5 text-sm"
                      >
                        {c.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </aside>
        </div>

        {preview && (
          <details id="text" className="mt-12 max-w-3xl scroll-mt-16">
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