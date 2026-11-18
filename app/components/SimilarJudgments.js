import Link from "next/link";
import prisma from "../../lib/prisma";
import EmbedAndRefresh from "./EmbedAndRefresh";

// Rough cut-offs. Adjust them after you test with your own judgments.
const VERY_SIMILAR = 0.85;
const SIMILAR = 0.75;

function strengthLabel(s) {
  if (s >= VERY_SIMILAR) return "Very similar";
  if (s >= SIMILAR) return "Similar";
  return "Loosely related";
}

export default async function SimilarJudgments({ judgmentId, userId, citations }) {
  let missing = 0;
  let rows = [];
  const sharedBy = {};

  try {
    const countRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS n FROM "Judgment"
      WHERE "userId" = ${userId} AND "summary" IS NOT NULL AND "embedding" IS NULL`;
    missing = countRows[0]?.n ?? 0;

    if (missing === 0) {
      rows = await prisma.$queryRaw`
        SELECT j."id", j."title", j."caseNumber", j."court", j."outcome",
               1 - (j."embedding" <=> s."embedding") AS similarity
        FROM "Judgment" j
        JOIN "Judgment" s ON s."id" = ${judgmentId}
        WHERE j."userId" = ${userId}
          AND j."id" <> ${judgmentId}
          AND j."embedding" IS NOT NULL
        ORDER BY j."embedding" <=> s."embedding"
        LIMIT 5`;

      const myKeys = (citations || []).map((c) => c.normalized).filter(Boolean);
      if (rows.length > 0 && myKeys.length > 0) {
        const shared = await prisma.citation.findMany({
          where: {
            judgmentId: { in: rows.map((r) => r.id) },
            normalized: { in: myKeys },
          },
          select: { judgmentId: true, text: true },
        });
        for (const c of shared) {
          (sharedBy[c.judgmentId] ||= []).push(c.text);
        }
      }
    }
  } catch (err) {
    console.error("Similar judgments failed:", err);
    return null;
  }

  return (
    <div className="mt-10">
      <h3 className="font-serif text-xl">Similar judgments</h3>
      <p className="mt-1 text-sm text-muted">Matched by meaning across your other uploads.</p>

      {missing > 0 ? (
        <EmbedAndRefresh />
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Nothing to compare yet. Upload more judgments and similar ones will appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {rows.map((r) => {
            const sim = Math.max(0, Math.min(1, Number(r.similarity)));
            const sharedCites = sharedBy[r.id] || [];
            const meta = [r.caseNumber, r.court].filter(Boolean).join(", ");
            return (
              <li key={r.id}>
                <Link href={`/judgments/${r.id}`} className="block py-4 transition hover:bg-white/70">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{r.title}</p>
                      {meta && <p className="mt-0.5 text-sm text-muted">{meta}</p>}
                      {r.outcome && <p className="mt-1 text-sm">{r.outcome}</p>}
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm">{strengthLabel(sim)}</p>
                      <div className="mt-1.5 ml-auto h-1 w-24 rounded bg-rule" aria-hidden="true">
                        <div
                          className="h-1 rounded bg-brass"
                          style={{ width: `${Math.round(sim * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">{Math.round(sim * 100)}% match</p>
                    </div>
                  </div>
                  {sharedCites.length > 0 && (
                    <p className="mt-2 border-l-2 border-brass pl-3 text-sm text-muted">
                      Shares {sharedCites.length} {sharedCites.length === 1 ? "citation" : "citations"}:{" "}
                      {sharedCites.slice(0, 3).join(", ")}
                      {sharedCites.length > 3 ? "…" : ""}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}