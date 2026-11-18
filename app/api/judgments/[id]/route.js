import { del } from "@vercel/blob";
import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await params;
  const judgment = await prisma.judgment.findUnique({ where: { id } });
  if (!judgment || judgment.userId !== session.user.id) {
    return Response.json({ error: "Judgment not found." }, { status: 404 });
  }

  // Citations and hearings are removed automatically (cascade)
  await prisma.judgment.delete({ where: { id } });

  // Remove the stored PDF too; if this fails the record is still gone
  try {
    await del(judgment.fileUrl);
  } catch (err) {
    console.error("Could not delete the PDF from storage:", err);
  }

  return Response.json({ ok: true });
}