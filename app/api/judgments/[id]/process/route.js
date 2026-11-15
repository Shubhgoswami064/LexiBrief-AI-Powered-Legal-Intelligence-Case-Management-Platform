import { auth } from "../../../../../auth";
import prisma from "../../../../../lib/prisma";
import { extractPdfText } from "../../../../../lib/extract";
import { looksUnreadable } from "../../../../../lib/textcheck";
import { ocrPdf } from "../../../../../lib/ocr";

export const maxDuration = 300;

async function markFailed(id, message, pageCount, status) {
  await prisma.judgment.update({
    where: { id },
    data: { status: "FAILED", errorMessage: message, pageCount: pageCount ?? null },
  });
  return Response.json({ error: message }, { status });
}

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

  try {
    // 1. Try normal text extraction first (free and fast)
    const extracted = await extractPdfText(judgment.fileUrl);
    const pageCount = extracted.pageCount;
    let text = (extracted.text || "").replace(/\u0000/g, "").trim();

    // 2. If it is empty or garbled (scan or old Hindi font), read it with AI
    if (text.length < 50 || looksUnreadable(text)) {
      if (!process.env.GEMINI_API_KEY) {
        return markFailed(
          id,
          "This PDF needs AI reading, but the AI key is not set up.",
          pageCount,
          422
        );
      }
      const ocr = await ocrPdf(judgment.fileUrl);
      text = ocr.text.replace(/\u0000/g, "").trim();
      console.log(`AI reading used: ${ocr.pagesRead} of ${ocr.totalPages} pages`);
    }

    if (text.length < 50) {
      return markFailed(id, "No readable text was found in this PDF.", pageCount, 422);
    }

    await prisma.judgment.update({
      where: { id },
      data: { fullText: text, pageCount, status: "READY", errorMessage: null },
    });
    return Response.json({ ok: true, pageCount });
  } catch (err) {
    console.error("Processing failed:", err);
    return markFailed(id, "Could not read this PDF. Try another file.", null, 500);
  }
}