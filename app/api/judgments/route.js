import { auth } from "../../../auth";
import prisma from "../../../lib/prisma";
import { isBlobUrl } from "../../../lib/blob";

export async function POST(req) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const body = await req.json();
  const title = body?.title?.toString().trim();
  const caseNumber = body?.caseNumber?.toString().trim();
  const court = body?.court?.toString().trim();
  const fileUrl = body?.fileUrl?.toString();

  if (!title) {
    return Response.json({ error: "Enter a title for the judgment." }, { status: 400 });
  }
  if (!isBlobUrl(fileUrl)) {
    return Response.json({ error: "Invalid file." }, { status: 400 });
  }

  const judgment = await prisma.judgment.create({
    data: {
      title,
      caseNumber: caseNumber || null,
      court: court || null,
      fileUrl,
      userId: session.user.id,
    },
  });

  return Response.json({ id: judgment.id }, { status: 201 });
}