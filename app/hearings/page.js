import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../auth";
import prisma from "../../lib/prisma";
import { istDayRange } from "../../lib/ist";
import Sidebar from "../components/Sidebar";

const ROLE_LABEL = {
  LAWYER: "Lawyer",
  OFFICIAL: "Court official",
  ADMIN: "Administrator",
};
const TZ = "Asia/Kolkata";

function daysUntil(date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function whenLabel(date) {
  const days = daysUntil(date);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export default async function HearingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const todayStart = istDayRange(0).start;
  const include = {
    judgment: { select: { id: true, title: true, caseNumber: true, court: true } },
  };

  const [upcoming, past] = await Promise.all([
    prisma.hearing.findMany({
      where: { judgment: { userId: session.user.id }, date: { gte: todayStart } },
      orderBy: { date: "asc" },
      take: 100,
      include,
    }),
    prisma.hearing.findMany({
      where: { judgment: { userId: session.user.id }, date: { lt: todayStart } },
      orderBy: { date: "desc" },
      take: 10,
      include,
    }),
  ]);

  // group upcoming hearings by month
  const groups = new Map();
  for (const h of upcoming) {
    const key = new Date(h.date).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: TZ,
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(h);
  }

  function Row({ h, muted }) {
    const soon = !muted && daysUntil(h.date) <= 3;
    return (
      <li className="flex gap-4">
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
          <Link href={`/judgments/${h.judgment.id}`} className="block truncate font-medium hover:underline">
            {h.judgment.title}
          </Link>
          <p className="text-sm text-muted">
            {[h.judgment.caseNumber, h.judgment.court, h.purpose].filter(Boolean).join(", ") ||
              "Hearing"}
          </p>
          {!muted && (
            <p className={`mt-1 text-sm ${soon ? "font-medium text-brass" : "text-muted"}`}>
              {whenLabel(h.date)}
            </p>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <Sidebar
        name={session.user.name || session.user.email}
        roleLabel={ROLE_LABEL[session.user.role] || "Lawyer"}
      />

      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <h1 className="font-serif text-3xl">Hearings</h1>
        <p className="mt-2 max-w-xl text-muted">
          Hearing dates from all your judgments. Add or change a date on the judgment's page.
        </p>

        {upcoming.length === 0 ? (
          <div className="mt-8 max-w-xl rounded-lg border border-dashed border-rule bg-white/60 px-6 py-12 text-center">
            <p className="font-serif text-lg">No upcoming hearings</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Open a judgment and add its next hearing date. You will get an email the day before.
            </p>
            <Link href="/judgments" className="btn-primary mt-6">
              Go to judgments
            </Link>
          </div>
        ) : (
          <div className="mt-10 max-w-2xl space-y-10">
            {[...groups.entries()].map(([month, items]) => (
              <section key={month}>
                <h2 className="border-b border-rule pb-2 font-serif text-xl">{month}</h2>
                <ul className="mt-5 space-y-6">
                  {items.map((h) => (
                    <Row key={h.id} h={h} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <details className="mt-12 max-w-2xl">
            <summary className="cursor-pointer font-serif text-xl">Past hearings</summary>
            <ul className="mt-5 space-y-6">
              {past.map((h) => (
                <Row key={h.id} h={h} muted />
              ))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}