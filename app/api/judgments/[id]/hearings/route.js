import { auth } from "../../../../../auth";
import prisma from "../../../../../lib/prisma";
import { parseIstDate } from "../../../../../lib/ist";

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

  const body = await req.json();
  const date = parseIstDate(body?.date);
  if (!date) {
    return Response.json({ error: "Choose a valid date." }, { status: 400 });
  }
  const purpose = body?.purpose?.toString().trim().slice(0, 200) || null;

  const hearing = await prisma.hearing.create({
    data: { date, purpose, judgmentId: id },
  });
  return Response.json({ id: hearing.id }, { status: 201 });
}