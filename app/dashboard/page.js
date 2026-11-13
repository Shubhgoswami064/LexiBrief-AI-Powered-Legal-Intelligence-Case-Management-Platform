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

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [total, ready, processing, recent, hearings] = await Promise.all([
    prisma.judgment.count({ where: { userId } }),
    prisma.judgment.count({ where: { userId, status: "READY" } }),
    prisma.judgment.count({ where: { userId, status: "PROCESSING" } }),
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
  ]);

  const displayName = session.user.name || session.user.email;
  const firstName = displayName.split(/[ @]/)[0];
  const roleLabel = ROLE_LABEL[session.user.role] || "Lawyer";

  const stats = [
    { label: "Judgments uploaded", value: total },
    { label: "Summaries ready", value: ready },
    { label: "Being processed", value: processing },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar name={displayName} roleLabel={roleLabel} />

      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
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

        <dl className="mt-10 grid grid-cols-3 border-y border-rule">
          {stats.map((s) => (
            <div key={s.label} className="border-l border-rule px-4 py-5 first:border-l-0 lg:px-6">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-1 font-serif text-3xl">{s.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-12 xl:grid-cols-[1.5fr_1fr]">
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
                No hearings scheduled. Hearing dates found in your judgments will show up here.
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
      </main>
    </div>
  );
}