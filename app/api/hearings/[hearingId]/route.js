import { auth } from "../../../../auth";
import prisma from "../../../../lib/prisma";
import { parseIstDate } from "../../../../lib/ist";

async function getOwnedHearing(hearingId, userId) {
  const hearing = await prisma.hearing.findUnique({
    where: { id: hearingId },
    include: { judgment: { select: { userId: true } } },
  });
  if (!hearing || hearing.judgment.userId !== userId) return null;
  return hearing;
}

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { hearingId } = await params;
  const hearing = await getOwnedHearing(hearingId, session.user.id);
  if (!hearing) {
    return Response.json({ error: "Hearing not found." }, { status: 404 });
  }

  const body = await req.json();
  const date = parseIstDate(body?.date);
  if (!date) {
    return Response.json({ error: "Choose a valid date." }, { status: 400 });
  }
  const purpose = body?.purpose?.toString().trim().slice(0, 200) || null;

  await prisma.hearing.update({
    where: { id: hearingId },
    data: {
      date,
      purpose,
      // a changed date should get a fresh reminder
      reminderSentAt: date.getTime() !== hearing.date.getTime() ? null : hearing.reminderSentAt,
    },
  });
  return Response.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const { hearingId } = await params;
  const hearing = await getOwnedHearing(hearingId, session.user.id);
  if (!hearing) {
    return Response.json({ error: "Hearing not found." }, { status: 404 });
  }

  await prisma.hearing.delete({ where: { id: hearingId } });
  return Response.json({ ok: true });
}