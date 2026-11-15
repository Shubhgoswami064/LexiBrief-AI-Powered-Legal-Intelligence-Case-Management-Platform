import { auth } from "../../../../../auth";
import prisma from "../../../../../lib/prisma";
import { geminiGenerate } from "../../../../../lib/gemini";
import {
  MAX_CHARS,
  buildPrompt,
  parseAiJson,
  cleanResult,
} from "../../../../../lib/summarize";

export const maxDuration = 300;

export async function POST(req, { params }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await params;
  const judgment = await prisma.judgment.findUnique({ where: { id } });
  if (!judgment || judgment.userId !== session.user.id) {
    return Response.json({ error: "Judgment not found." }, { status: 404 });
  }
  if (!judgment.fullText) {
    return Response.json(
      { error: "This judgment has no readable text to summarize." },
      { status: 400 }
    );
  }

  try {
    const text =
      judgment.fullText.length > MAX_CHARS
        ? judgment.fullText.slice(0, MAX_CHARS)
        : judgment.fullText;

    const raw = await geminiGenerate({
      parts: [{ text: buildPrompt(text) }],
      maxOutputTokens: 16000,
      json: true,
    });

    const r = cleanResult(parseAiJson(raw), judgment.fullText);

    await prisma.$transaction([
      prisma.citation.deleteMany({ where: { judgmentId: id } }),
      prisma.hearing.deleteMany({ where: { judgmentId: id } }),
      prisma.judgment.update({
        where: { id },
        data: {
          summary: r.summary,
          keyPoints: r.keyPoints,
          outcome: r.outcome,
          parties: r.parties,
          language: r.language,
          caseNumber: judgment.caseNumber || r.caseNumber,
          court: judgment.court || r.court,
          summarizedAt: new Date(),
        },
      }),
      prisma.citation.createMany({
        data: r.citations.map((c) => ({
          text: c.text,
          normalized: c.normalized,
          judgmentId: id,
        })),
      }),
      prisma.hearing.createMany({
        data: r.hearings.map((h) => ({
          date: h.date,
          purpose: h.purpose,
          judgmentId: id,
        })),
      }),
    ]);

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Summary failed:", err);
    const busy = /quota|429|rate|exhausted/i.test(err.message || "");
    return Response.json(
      {
        error: busy
          ? "The AI service is busy. Wait a minute and try again."
          : "Could not create the summary. Try again.",
      },
      { status: 500 }
    );
  }
}