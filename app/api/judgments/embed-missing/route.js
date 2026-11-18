import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";
import { embedJudgment } from "../../../../lib/embed";

export const maxDuration = 120;

export async function POST() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const rows = await prisma.$queryRaw`
    SELECT "id" FROM "Judgment"
    WHERE "userId" = ${session.user.id}
      AND "summary" IS NOT NULL
      AND "embedding" IS NULL
    LIMIT 20`;

  let done = 0;
  for (const row of rows) {
    try {
      await embedJudgment(row.id);
      done++;
    } catch (err) {
      console.error("Embedding failed for", row.id, err);
    }
  }

  if (rows.length > 0 && done === 0) {
    return Response.json({ error: "Could not compare judgments right now." }, { status: 500 });
  }
  return Response.json({ ok: true, embedded: done });
}