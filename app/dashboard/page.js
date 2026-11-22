import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import prisma from "../../lib/prisma";
import { istDayRange, toDateInputValue } from "../../lib/ist";
import Sidebar from "../components/Sidebar";

const ROLE_LABEL = {
  LAWYER: "Lawyer",
  OFFICIAL: "Court official",
  ADMIN: "Administrator",
};
const TZ = "Asia/Kolkata";

function hearingLabel(date) {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

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

function BarRow({ label, value, max, unit, index, color = "bg-brass" }) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-muted">
          {value} {value === 1 ? unit : `${unit}s`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded bg-rule" aria-hidden="true">
        <div
          className={`bar-grow h-1.5 rounded ${color}`}
          style={{ width: `${pct}%`, "--i": index }}
        />
      </div>
    </li>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const startOfToday = istDayRange(0).start;
  const weekEnd = istDayRange(7).start;

  const [
    total,
    summarized,
    citationTotal,
    recent,
    hearings,
    weekHearings,
    topCitations,
    languages,
  ] = await Promise.all([
    prisma.judgment.count({ where: { userId } }),
    prisma.judgment.count({ where: { userId, summarizedAt: { not: null } } }),
    prisma.citation.count({ where: { judgment: { userId } } }),
    prisma.judgment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, caseNumber: true, court: true, status: true, createdAt: true },
    }),
    prisma.hearing.findMany({
      where: { judgment: { userId }, date: { gte: startOfToday } },
      orderBy: { date: "asc" },
      take: 5,
      include: { judgment: { select: { id: true, title: true, caseNumber: true } } },
    }),
    prisma.hearing.findMany({
      where: { judgment: { userId }, date: { gte: startOfToday, lt: weekEnd } },
      select: { date: true },
    }),
    prisma.citation.groupBy({
      by: ["normalized"],
      where: { judgment: { userId }, normalized: { not: null } },
      having: { normalized: { _count: { gt: 1 } } },
      _count: { normalized: true },
      orderBy: { _count: { normalized: "desc" } },
      take: 5,
    }),
    prisma.judgment.groupBy({
      by: ["language"],
      where: { userId, language: { not: null } },
      _count: { language: true },
    }),
  ]);

  const displayName = session.user.name || session.user.email;
  const firstName = displayName.split(/[ @]/)[0];
  const roleLabel = ROLE_LABEL[session.user.role] || "Lawyer";

  // The next 7 days, in Indian time, with the number of hearings on each
  const perDay = {};
  for (const h of weekHearings) {
    const key = toDateInputValue(h.date);
    perDay[key] = (perDay[key] || 0) + 1;
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const { start } = istDayRange(i);
    return {
      key: toDateInputValue(start),
      isToday: i === 0,
      weekday: start.toLocaleDateString("en-IN", { weekday: "short", timeZone: TZ }),
      day: start.toLocaleDateString("en-IN", { day: "numeric", timeZone: TZ }),
      count: perDay[toDateInputValue(start)] || 0,
    };
  });

  const stats = [
    { label: "Judgments", value: total },
    { label: "Summaries ready", value: summarized },
    { label: "Hearings this week", value: weekHearings.length },
    { label: "Citations tracked", value: citationTotal },
  ];

  const maxCite = Math.max(1, ...topCitations.map((c) => c._count.normalized));
  const langRows = languages
    .map((l) => ({ name: l.language, count: l._count.language }))
    .sort((a, b) => b.count - a.count);
  const maxLang = Math.max(1, ...langRows.map((l) => l.count));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar name={displayName} roleLabel={roleLabel} />

      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <header className="reveal flex flex-wrap items-end justify-between gap-4" style={{ "--i": 0 }}>
          <div>
            <h1 className="font-serif text-3xl">Welcome, {firstName}</h1>
            <p className="mt-2 text-muted">
              Upload a judgment to get its summary, key points and citations.
            </p>
          </div>
          <Link href="/upload" className="btn-primary">
            Upload judgment
          </Link>
        </header>

        <dl
          className="reveal mt-10 grid grid-cols-2 gap-px border-y border-rule bg-rule lg:grid-cols-4"
          style={{ "--i": 1 }}
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-paper px-4 py-5 lg:px-6">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-1 font-serif text-3xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        <section className="reveal mt-10" style={{ "--i": 2 }}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-xl">The next 7 days</h2>
            <Link
              href="/hearings"
              className="text-sm text-muted underline underline-offset-4 hover:text-ink"
            >
              All hearings
            </Link>
          </div>
          <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
            {week.map((d) => (
              <li
                key={d.key}
                aria-current={d.isToday ? "date" : undefined}
                className={`rounded-md border px-1 py-3 text-center sm:px-2 ${
                  d.count > 0 ? "border-brass bg-white" : "border-rule bg-white/50"
                } ${d.isToday ? "ring-1 ring-ink" : ""}`}
              >
                <p className="text-xs text-muted">{d.isToday ? "Today" : d.weekday}</p>
                <p className="mt-1 font-serif text-2xl leading-none">{d.day}</p>
                <p className="mt-2 text-xs">
                  {d.count > 0 ? (
                    <span className="font-medium text-brass">
                      {d.count}
                      <span className="hidden sm:inline">
                        {" "}
                        {d.count === 1 ? "hearing" : "hearings"}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="reveal mt-12 grid gap-12 xl:grid-cols-[1.5fr_1fr]" style={{ "--i": 3 }}>
          <section>
            <h2 className="font-serif text-xl">Recent judgments</h2>

            {recent.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-rule bg-white/60 px-6 py-12 text-center">
                <p className="font-serif text-lg">No judgments yet</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  Upload a PDF and the summary, key points and citations will appear here.
                </p>
                <Link href="/upload" className="btn-primary mt-6">
                  Upload your first judgment
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {recent.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/judgments/${j.id}`}
                      className="flex items-center justify-between gap-4 py-4 transition hover:bg-white/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{j.title}</p>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {[j.caseNumber, j.court].filter(Boolean).join(", ") || "No case details yet"}
                        </p>
                      </div>
                      <StatusPill status={j.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="xl:border-l xl:border-rule xl:pl-12">
            <h2 className="font-serif text-xl">Upcoming hearings</h2>

            {hearings.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No hearings scheduled. Add a date on a judgment's page and it will show up here.
              </p>
            ) : (
              <ul className="mt-4 space-y-5">
                {hearings.map((h) => {
                  const soon = Math.ceil((new Date(h.date).getTime() - Date.now()) / 86400000) <= 3;
                  return (
                    <li key={h.id} className="flex gap-4">
                      <div
                        className={`w-14 shrink-0 border-t-2 pt-2 text-center ${
                          soon ? "border-brass" : "border-rule"
                        }`}
                      >
                        <p className="font-serif text-2xl leading-none">
                          {new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", timeZone: TZ })}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(h.date).toLocaleDateString("en-IN", { month: "short", timeZone: TZ })}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/judgments/${h.judgment.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {h.judgment.title}
                        </Link>
                        <p className="text-sm text-muted">
                          {h.purpose || h.judgment.caseNumber || "Hearing"}
                        </p>
                        <p className={`mt-1 text-sm ${soon ? "font-medium text-brass" : "text-muted"}`}>
                          {hearingLabel(h.date)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="reveal mt-14 grid gap-12 border-t border-rule pt-10 xl:grid-cols-2" style={{ "--i": 4 }}>
          <section>
            <h2 className="font-serif text-xl">Most cited authorities</h2>
            <p className="mt-1 text-sm text-muted">
              Citations that appear in more than one of your judgments.
            </p>
            {topCitations.length === 0 ? (
              <p className="mt-5 text-sm text-muted">
                Nothing yet. Once two judgments cite the same case, it shows up here.
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {topCitations.map((c, i) => (
                  <BarRow
                    key={c.normalized}
                    label={c.normalized}
                    value={c._count.normalized}
                    max={maxCite}
                    unit="judgment"
                    index={i}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-serif text-xl">Languages</h2>
            <p className="mt-1 text-sm text-muted">The language of your summarized judgments.</p>
            {langRows.length === 0 ? (
              <p className="mt-5 text-sm text-muted">Nothing yet. Summarize a judgment to see this.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {langRows.map((l, i) => (
                  <BarRow
                    key={l.name}
                    label={l.name}
                    value={l.count}
                    max={maxLang}
                    unit="judgment"
                    index={i}
                    color="bg-ink"
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}